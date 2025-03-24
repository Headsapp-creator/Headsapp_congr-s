/* eslint-disable no-undef */
module.exports = {
    extends: [
      "eslint:recommended",
      "plugin:react/recommended",
      "plugin:react-hooks/recommended",
      "plugin:import/errors",
      "plugin:import/warnings",
      "plugin:jsx-a11y/recommended",
      "prettier",
    ],
    plugins: ["react", "react-hooks", "import", "jsx-a11y" , "jsx-a11y"],
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "prettier/prettier": "error", // Ensure Prettier rules are enforced
    },
  };
  