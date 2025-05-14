import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col">
        <h1 className="text-4xl font-bold mb-8">Welcome to Annos</h1>
        <p className="text-xl mb-8">Your annotation platform</p>
        
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-semibold mb-6 text-center">Sign In</h2>
          <p className="mb-6 text-center text-gray-600">
            Please sign in to access your annotations
          </p>
          <div className="flex justify-center">
            <Button className="w-full">
              Sign in with Bluesky
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
