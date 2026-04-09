"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Signup from "@/actions/signup";
import toast from "react-hot-toast";
export default function LoginPage() {
  const router=useRouter()
  const [name,setname]=useState("")
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e:any) => {
    e.preventDefault();
    const respnse=await Signup({name:name,email:email,password:password})
    if(respnse==="Alredy account"){
       router.push("/login")
       toast.error("Already an Account")
    }
    else if(respnse==="Sign up successfull"){
        router.push("/compiler")
        toast.success("Sign up Successfull")
    }
    setMessage("Sign Up successfull")
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center" style={{fontFamily:"'Robotomono',monospace"}}>Sign In</h2>
        <form className="space-y-4" onSubmit={handleLogin}>
          <Label htmlFor="name" style={{fontFamily:"'Robotomono',monospace"}}>Name</Label>
            <Input value={name} id="name" type="text" placeholder="Enter ur name..." onChange={(e)=>{e.stopPropagation();setname(e.target.value)}}/>
          <div>
            <Label htmlFor="email" style={{fontFamily:"'Robotomono',monospace"}}>Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@gmail.com"
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
          Already have an account?{" "}
          <a href="/signup" className="text-blue-600 hover:underline" style={{fontFamily:"'Robotomono',monospace"}}>
            LogIn
          </a>
        </p>
      </Card>
    </div>
  );
}