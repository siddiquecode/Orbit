const mongoose=require('mongoose')

const connectDB=async()=>{
    try{
        console.log('MongoDB has connected')
        const connection=await mongoose.connect('mongodb://127.0.0.1:27017/orbit',{})
        // const connection=await mongoose.connect('mongodb+srv://siddiquehussain2002:VggxDuRQDiwNBymF@orbit.zc8px.mongodb.net/Orbit?retryWrites=true&w=majority',{})
    }catch(err){
        console.log('MongoDB has not connected')
        console.log(err)
    }
}
module.exports=connectDB;