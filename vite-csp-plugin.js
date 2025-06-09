export default function cspPlugin() {
  return {
    name: 'configure-csp',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        res.setHeader(
          'Content-Security-Policy',
          "default-src 'self'; img-src 'self' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self' http://localhost:5000"
        )
        next()
      })
    }
  }
}
