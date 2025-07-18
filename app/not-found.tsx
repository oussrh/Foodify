export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-8">
      <h1 className="text-4xl font-bold">Page Not Found</h1>
      <p className="text-muted-foreground mt-2">Sorry, we couldn't find the page you're looking for.</p>
      <a href="/" className="mt-6 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Return Home</a>
    </div>
  )
}
