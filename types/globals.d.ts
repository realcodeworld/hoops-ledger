// Global type declarations for Node.js APIs
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test'
      DATABASE_URL: string
      NEXTAUTH_SECRET: string
      [key: string]: string | undefined
    }

    interface Global {
      Buffer: typeof Buffer
    }
  }

  var process: NodeJS.Process
  var Buffer: BufferConstructor
}

export {}