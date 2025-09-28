# EnzymeML Suite

A modern desktop application for creating, editing, and visualizing [EnzymeML](https://enzymeml.org/) documents. Built with Tauri, React, and TypeScript, the EnzymeML Suite provides a comprehensive graphical interface for managing enzyme kinetics data and computational modeling workflows through its Jupyter integration.

## 🧬 About EnzymeML

EnzymeML is a data exchange format that supports the comprehensive documentation of enzymatic data by describing reaction conditions, time courses of substrate and product concentrations, the kinetic model, and the estimated kinetic parameters. This desktop application serves as the primary GUI for the EnzymeML ecosystem.

## ✨ Key Features

### 📊 **Data Management**

- **Local Database**: Built-in SQLite database for persistent data storage
- **Entity Management**: Create and manage proteins, small molecules, reactions, vessels, and measurements
- **Import/Export**: Load and save EnzymeML documents in JSON format
- **Data Validation**: Schema validation and type checking for data integrity

### 🤖 **AI-Powered Extraction**

- **OpenAI Integration**: Extract experimental data from text using GPT models
- **Intelligent Parsing**: Automatically identify and structure enzyme kinetics parameters
- **Context-Aware Processing**: Schema-based extraction with validation

### 📓 **Jupyter Integration**

- **Built-in Templates**: Pre-configured notebooks for common modeling tasks:
  - Basic analysis and visualization
  - Bayesian parameter inference
  - Neural ODE modeling
  - COPASI integration
  - Parameter estimation workflows
  - PySCeS simulations
  - Surrogate Bayesian inference
  - Universal ODE solving
- **Seamless Workflow**: Launch Jupyter Lab directly from the application
- **Python Environment Detection**: Automatic Python version checking and setup

### 🔬 **Scientific Tools**

- **Chemical Structure Visualization**: SMILES-based molecular structure drawing
- **Mathematical Expressions**: LaTeX and MathML rendering for equations
- **Kinetic Law Builder**: Interactive kinetic rate law construction
- **Data Visualization**: Interactive charts and plots using Nivo and Highcharts
- **Equation Editor**: Mathematical formula editing with MathLive

### 🎨 **Modern Interface**

- **Cross-Platform**: Available for Windows, macOS, and Linux
- **Dark/Light Themes**: Adaptive theme support with system preference detection
- **Responsive Design**: Optimized for various screen sizes
- **Keyboard Shortcuts**: Efficient workflow with customizable shortcuts
- **Intuitive Navigation**: Sidebar-based navigation with contextual menus

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Rust](https://rustup.rs/) (latest stable)
- [Python](https://www.python.org/downloads/) (for Jupyter integration)

### Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/EnzymeML/enzymeml-suite.git 
   cd enzymeml-dashboard
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run in development mode**

   ```bash
   cargo tauri dev
   ```

   This will start both the React development server and the Tauri application.

### Building for Production

```bash
# Build the application for distribution
cargo tauri build
```

The built application will be available in `src-tauri/target/release/bundle/`.

## 🛠 Development Tools

- **ESLint**: Code linting and formatting
- **TypeScript**: Type checking and enhanced IDE support
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Fast build tool and development server
- **Tauri**: Cross-platform desktop application framework

### Available Scripts

```bash
npm run dev          # Start Vite development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run tauri        # Run Tauri CLI commands
cargo tauri dev      # Start development with hot reload
cargo tauri build    # Build application for distribution
```

### Code Quality

The project uses ESLint for code quality and consistency:

```bash
npm run lint         # Run ESLint
npm run lint:fix     # Fix auto-fixable issues
```

## 📁 Project Structure

```

├── src/                    # React frontend source code
├── src-tauri/             # Rust backend source code
├── jupyter-templates/     # Jupyter notebook templates
└── dist/                  # Built frontend assets
```

## 🔧 Configuration

The application can be configured through:

- `tauri.conf.json` - Tauri application settings
- `vite.config.ts` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS customization
- `eslint.config.ts` - ESLint rules and settings

## 📖 Usage

1. **Create New Document**: Start with an empty EnzymeML document or load an existing one
2. **Define Entities**: Add proteins, small molecules, vessels, and reactions
3. **Input Measurements**: Import experimental data and time-course measurements
4. **Build Models**: Use the kinetic law builder or Jupyter templates for modeling
5. **Analyze Results**: Visualize data and import seamlessly into Jupyter notebooks
6. **AI Assistance**: Use the extraction assistant to parse experimental data from text

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Extending Jupyter Templates

To extend the Jupyter templates, you can add new templates to the `jupyter-templates` directory and open a pull request. The `Base.ipynb` template is the base template for all other templates and makes use of the `PyEnzyme` library to read the EnzymeML document and perform the analysis. Use it as a reference to create your own templates.

## 📄 License

This project is part of the EnzymeML ecosystem. Please refer to the license file for details.

## 🔗 Related Projects

- [EnzymeML Specification](https://enzymeml.org/)
- [EnzymeML Python API](https://github.com/EnzymeML/enzymeml-python)
- [EnzymeML TypeScript API](https://github.com/EnzymeML/enzymeml-ts)

## 💬 Support

For questions, issues, or contributions, please visit the [EnzymeML organization](https://github.com/EnzymeML) or refer to the [official documentation](https://enzymeml.org/usage/).