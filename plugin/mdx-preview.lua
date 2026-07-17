if vim.g.loaded_mdx_preview then
  return
end

vim.g.loaded_mdx_preview = true

vim.api.nvim_create_user_command("MdxPreview", function()
  require("mdx-preview").start()
end, { desc = "Start an MDX preview" })

vim.api.nvim_create_user_command("MdxPreviewStop", function()
  require("mdx-preview").stop()
end, { desc = "Stop the MDX preview server" })
