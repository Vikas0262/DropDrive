# DropDrive

A modern, cloud-based file storage and sharing platform built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Features

- **File Upload & Storage**: Securely store your files in the cloud
- **File Sharing**: Share files with others through shareable links
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Clean and intuitive user interface built with modern web technologies
- **Type Safety**: Built with TypeScript for better developer experience

## 🛠️ Tech Stack

- **Frontend Framework**: Next.js 13+ (App Router)
- **Styling**: Tailwind CSS
- **Type Safety**: TypeScript
- **UI Components**: Shadcn/ui
- **State Management**: React Context API
- **Form Handling**: React Hook Form
- **Icons**: Lucide React

## 📦 Prerequisites

- Node.js 18.0.0 or later
- npm or pnpm (recommended)

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/dropdrive.git
   cd dropdrive
   ```

2. **Install dependencies**
   ```bash
   # Using npm
   npm install
   
   # or using pnpm
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory and add the following variables:
   ```env
   NEXT_PUBLIC_API_URL=your_api_url_here
   # Add other environment variables as needed
   ```

4. **Run the development server**
   ```bash
   # Using npm
   npm run dev
   
   # or using pnpm
   pnpm dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000) in your browser**

## 🏗️ Project Structure

```
.
├── app/                  # App router pages and layouts
├── components/           # Reusable React components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and configurations
├── public/               # Static files
├── styles/               # Global styles
├── .gitignore            # Git ignore file
├── next.config.mjs       # Next.js configuration
├── package.json          # Project dependencies and scripts
├── postcss.config.mjs    # PostCSS configuration
├── tailwind.config.ts    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

## 📝 Available Scripts

- `dev` - Start the development server
- `build` - Build the application for production
- `start` - Start the production server
- `lint` - Run ESLint
- `type-check` - Run TypeScript type checking

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework for Production
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Shadcn/ui](https://ui.shadcn.com/) - Beautifully designed components
- [Lucide](https://lucide.dev/) - Beautiful & consistent icons

---

<p align="center">
  Made with ❤️ by Your Name
</p>
