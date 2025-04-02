const mongoose=require('mongoose');

const connectToDB=async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log('MongoDb connected successfully')
    }catch(err){
        console.error("Error while connecting to DB:",err);
        process.exit(1);
    }
}

module.exports=connectToDB;