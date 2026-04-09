"use server"
import Userodel from '@/models/userodel'
import ConnectDB from '@/database/db_configure'
import { userrlogin } from '@/types/user'
import bcrypt from 'bcrypt'
export default async function Login(Userata:userrlogin){
    await ConnectDB()
    const userata=await Userodel.findOne({email:Userata.email}).lean()
    const passwordcheck=await bcrypt.compare(Userata.password,userata.password)
    if(userata&&passwordcheck){
        return "Login successfull"
    }
    else{
        return "Sign Up"
    }
}