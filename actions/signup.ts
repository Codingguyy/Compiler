"use server"
import Userodel from "@/models/userodel"
import ConnectDb from '@/database/db_configure'
import { userrsignup } from "@/types/user"
import bcrypt from 'bcrypt'
export default async function Signup(Userata:userrsignup){
   await ConnectDb()
   const userata=await Userodel.findOne({name:Userata.name,email:Userata.email}).lean()
   if(userata){
    return "Alredy account"
   }
   else{
    const password=await bcrypt.hash(Userata.password,6)
    await new Userodel({...Userata,password:password}).save()
    return "Sign up successfull"
   }
}