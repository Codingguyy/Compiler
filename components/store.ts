import {create} from 'zustand'
import { usrlist } from '@/types/user'
type userregister={
    name:string,
    password:string,
    email:string,
    setname:(value:string)=>void,
    setpassword:(value:string)=>void,
    setemail:(value:string)=>void
}
type userlogin={
    password:string,
    email:string,
    setemail:(value:string)=>void,
    setpassword:(value:string)=>void
}
type searchname={
    name:string,
    setname:(value:string)=>void
}
type userlistttttt={
    users:usrlist[],
    message:string,
    setuser:(value:usrlist)=>void,
    setusrs:(value:usrlist[])=>void,
    setremoveuser:(value:usrlist)=>void,
    setmessage:(value:string)=>void
}
interface OptimizerResult {
  ir: string[]
  dependencies: Record<string, number[]>
  batches: number[][]
  sequential: { results: Record<string, number>; time: number }
  parallel: { results: Record<string, number>; time: number }
  normal_output: { stdout: string; stderr: string }
}

interface StoreState {
  value: boolean
  setvlue: (v: boolean) => void
  optimizerResult: OptimizerResult | null
  setOptimizerResult: (r: OptimizerResult) => void
}

export const Drawervalue = create<StoreState>((set) => ({
  value: false,
  setvlue: (v) => set({ value: v }),
  optimizerResult: null,
  setOptimizerResult: (r) => set({ optimizerResult: r }),
}))
export const Userregister=create<userregister>((set)=>({
    name:"",
    password:"",
    email:"",
    setname:(value)=>set(({name:value})),
    setpassword:(value)=>set(({password:value})),
    setemail:(value)=>set(({email:value}))
}))
export const Userlogin=create<userlogin>((set)=>({
    password:"",
    email:"",
    setemail:(value)=>set(({email:value})),
    setpassword:(value)=>set(({password:value}))
}))
export const Searchname=create<searchname>((set)=>({
    name:"",
    setname:(value)=>set((v)=>({name:value}))
}))
export const Toklue=create<searchname>((set)=>({
    name:"",
    setname:(value)=>set(({name:value}))
}))
export const Userlist=create<userlistttttt>((set)=>({
   users:[],
   message:"",
   setuser:(value)=>set((v)=>({users:[...v.users,value]})),
   setusrs:(value)=>set((v)=>({users:[...v.users,...value]})),
   setremoveuser:(value)=>set((v)=>({users:v.users.filter((valuee)=>valuee!==value)})),
   setmessage:(value)=>set(({message:value}))
}))
