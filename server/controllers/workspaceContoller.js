import prisma from "../configs/prisma.js";



//Get all workspaces for user
export const getUserWorkspaces= async (req,res)=>{
  try{
    const {userId}=await req.auth();
    const workspaces=await prisma.workspace.findMany({
      where:{
        members:{some:{userId:userId}}
      },
      include:{
        members:{include:{user:true}},
        projects:{
          include:{
            tasks:{include:{assignee:true,comments:{include:{user:true}}}},
            members:{include:{user:true}}
          }
        },
        owner:true
      }
    });
    res.json({workspaces})
  } catch (error){
    console.log(error);
    res.status(500).json({message:error.code ||error.message});
  }
}


// Add member to workspace
export const addMember= async (req,res) => {
  try{
    const{userId}=await req.auth();
    const {email,role,workspaceId,message}=req.body;

    // check if user exists
    const user=await prisma.user.findUnique({where:{email}})

    if(!user){
      return res.status(404).json({message:"use not found"})
    }
    if(!workspaceId || !role){
      return res.status(400).json({message:"Missing required parameters"})
      
    }
    if(!["ADMIN","MEMBER"].includes(role)){
      return res.status(400).json({message:"invalid role"})
    }
    // fetch workspace
    const workspace=await prisma.workspace.findUnique({where:{id:workspaceId},include:{members:true}})

    if(!workspace){
      return res.status(404).json({message:"workspace not found"})
    }
    // check creator has admin role
    if(!workspace.members.find((member)=>member.userId===userId && member.role==="ADMIN")){
      return res.status(401).json({message:"you do not have admin privilleges"})
    }

    // check if user is already a member
    const existingMember=workspace.members.find((member)=>member.userId===userId);
    if(existingMember){
      return res.status(400).json({message:"user is already a member"})
    }

    const member=await prisma.workspaceMember.create({
      data:{
        userId:user.id,
        workspaceId,
        role,
        message,
      } 
    })
    res.json({member,message:"Member added successfully"})    

  } catch (error){
    console.log(error);
    res.status(500).json({message:error.code||error.message});
  }
}