local M = {}

local defaults = {
  port = 4321,
  open_browser = true,
  follow_buffer = true,
}

local configuration = vim.deepcopy(defaults)
local server_job_id
local is_server_stopping = false
local state_path
local preview_url
local preview_group = vim.api.nvim_create_augroup("mdx-preview", { clear = true })

local function plugin_root()
  return vim.fn.fnamemodify(debug.getinfo(1, "S").source:sub(2), ":h:h:h")
end

local function is_previewable(path)
  return path:match("%.md$") ~= nil or path:match("%.mdx$") ~= nil
end

local function current_file()
  local path = vim.api.nvim_buf_get_name(0)
  if path == "" or not is_previewable(path) then
    vim.notify("mdx-preview: open a .md or .mdx file first", vim.log.levels.WARN)
    return nil
  end

  return vim.fn.fnamemodify(path, ":p")
end

local function write_state(path)
  if not state_path then
    return
  end

  local state = vim.json.encode({ file = path })
  local success, error_message = pcall(vim.fn.writefile, { state }, state_path)
  if not success then
    vim.notify("mdx-preview: could not update preview: " .. error_message, vim.log.levels.ERROR)
  end
end

local function update_preview()
  if configuration.follow_buffer and server_job_id then
    local path = current_file()
    if path then
      write_state(path)
    end
  end
end

local function open_preview(url)
  preview_url = url
  if configuration.open_browser then
    vim.ui.open(url)
  end
  vim.notify("mdx-preview: " .. url)
end

function M.setup(options)
  configuration = vim.tbl_deep_extend("force", vim.deepcopy(defaults), options or {})
end

function M.start()
  local path = current_file()
  if not path then
    return
  end

  if server_job_id then
    write_state(path)
    if preview_url then
      open_preview(preview_url)
    end
  else
    is_server_stopping = false
    state_path = vim.fn.stdpath("run") .. "/mdx-preview.json"
    write_state(path)

    local command = {
      "node",
      plugin_root() .. "/server/server.mjs",
      "--state",
      state_path,
      "--port",
      tostring(configuration.port),
    }

    server_job_id = vim.fn.jobstart(command, {
      on_stdout = function(_, data)
        for _, line in ipairs(data) do
          local url = line:match("MDX_PREVIEW_URL=(http://localhost:%d+)")
          if url then
            vim.schedule(function()
              open_preview(url)
            end)
          end
        end
      end,
      on_exit = function(_, exit_code)
        server_job_id = nil
        preview_url = nil
        if exit_code ~= 0 and not is_server_stopping then
          vim.schedule(function()
            vim.notify("mdx-preview server exited with code " .. exit_code, vim.log.levels.ERROR)
          end)
        end
        is_server_stopping = false
      end,
    })

    if server_job_id <= 0 then
      server_job_id = nil
      vim.notify("mdx-preview: could not start Node", vim.log.levels.ERROR)
      return
    end
  end

  if not preview_url then
    vim.notify("mdx-preview: starting preview server")
  end
end

function M.stop()
  if not server_job_id then
    return
  end

  is_server_stopping = true
  vim.fn.jobstop(server_job_id)
end

vim.api.nvim_create_autocmd("BufEnter", {
  group = preview_group,
  callback = update_preview,
})

return M
