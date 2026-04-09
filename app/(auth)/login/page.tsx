"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Login from '@/actions/login'
import toast from "react-hot-toast";
export default function LoginPage() {
  const router=useRouter() 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e:any) => {
    e.preventDefault();
    const respnse=await Login({email:email,password:password})
    if(respnse==="Login successfull"){
        router.push('/compiler')
        toast.success("Login successfull")
    }
    else if(respnse==="Sign Up"){
        router.push('/signup')
        toast.error("Don't have an Account")
    }
    setMessage("Login successfull")
};

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center" style={{fontFamily:"'Robotomono',monospace"}}>Sign In</h2>
        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <Label htmlFor="email" style={{fontFamily:"'Robotomono',monospace"}}>Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="password" style={{fontFamily:"'Robotomono',monospace"}}>Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          {message && (
            <p className="text-sm text-red-600 mt-1">{message}</p>
          )}

          <Button type="submit" className="w-full mt-4" style={{fontFamily:"'Robotomono',monospace"}}>
            Sign In
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500" style={{fontFamily:"'Robotomono',monospace"}}>
          Don’t have an account?{" "}
          <a href="/signup" className="text-blue-600 hover:underline" style={{fontFamily:"'Robotomono',monospace"}}>
            Sign Up
          </a>
        </p>
      </Card>
    </div>
  );
}