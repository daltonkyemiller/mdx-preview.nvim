vim.opt.rtp:append(".")

local function document_url()
  return vim.fn.system({ "curl", "--silent", "http://localhost:4329/api/document" })
end

vim.cmd("edit examples/custom-registry/index.mdx")
require("mdx-preview").setup({ open_browser = false, port = 4329 })
require("mdx-preview").start()
vim.wait(750)
assert(document_url():find("examples/custom%-registry/index.mdx"))

vim.cmd("edit README.md")
vim.wait(750)
assert(document_url():find("mdx%-preview.nvim/README.md"))

require("mdx-preview").stop()
