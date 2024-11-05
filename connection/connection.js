const mongoose=require('mongoose')

const connectDB=async()=>{
    try{
        console.log('MongoDB has connected')
        const connection=await mongoose.connect('mongodb://127.0.0.1:27017/orbit',{})
    }catch(err){
        console.log('MongoDB has not connected')
        console.log(err)
    }
}
module.exports=connectDB;