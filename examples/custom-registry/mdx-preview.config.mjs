export default {
  theme: "./theme.css",
  components: [
    {
      name: "StatusBadge",
      module: "./components/status-badge.jsx",
      export: "StatusBadge",
      description: "Highlight the current status of a plan or release.",
      when: "Use for a compact status label near a plan title.",
    },
  ],
};
