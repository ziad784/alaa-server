require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const formidable = require('formidable');
const bcrypt = require("bcrypt");
const fs = require("fs");
const { v4: uuidv4 } = require('uuid');
const path = require("path");
const mv = require("mv");


const saltRounds = 10;
const port = process.env.PORT


app.use(express.json())
app.use(express.static(__dirname))
app.use(cors({
    origin:["http://localhost:3000","https://aaladashboard.vercel.app"],
    methods:["POST","GET"],
    credentials: true
}));

var db_config = {
      host: 'eu-cdbr-west-02.cleardb.net',
      user: 'b1d0a3314f739d',
      password: '61f9ae86',
      database: 'heroku_66038776d72a1ed'
  };



let db;

function handleDisconnect(){
    db = mysql.createConnection(db_config);

    db.connect((err)=>{
        if(err){
            console.log("Database connection error because: ", err);
            setTimeout(handleDisconnect,2000);
        }
    })

    db.on("error",(err)=>{
        console.log("database Error: ",err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST'){
            handleDisconnect();
        }else{
            throw err;
        }
    })


}



handleDisconnect();


app.listen(port,()=>{
    console.log("I am Listening to ",port);
})


app.post("/upload/categories",(req,res)=>{
    const form = new formidable.IncomingForm()
  
    form.parse(req,(err,fields,files)=>{
      if(err){
        console.log(err);
        return
      }
   
      
      const ext = path.extname(files.photo.originalFilename)
      const videosPath = "imgs/categories/"
      const oldPath = files.photo.filepath
      const newPath = videosPath+uuidv4()+ext
     
     
  
   
  
  
      if(!fs.existsSync(videosPath)){
        fs.mkdir(videosPath,(err)=>{
          if(err){
            console.log(err);
            return
  
          }
  
  
   
        })
      }
  
      
  
      mv(oldPath,newPath,(err)=>{
        if(err){
          console.log(err);
          return
        }
  
  
        res.send(JSON.stringify({res:"ok",path:newPath}))
       
        
  
      })
  
      
  
  
    })
  
  })
  
  

app.post("/categories/add",(req,res)=>{
    const path = req.body.path;
    const title = req.body.title;
    const subTitle = req.body.subtitle

    const sql = "INSERT INTO categories(img,title,sub_title) VALUES (?,?,?)"
    db.query(sql,[path,title,subTitle],(err,data)=>{
        if(err){
            console.log(err);
            res.send(err)
            
        }


        if(data){
            res.json({res:"ok"})
        }


    })


})

app.post("/categories/edit",(req,res)=>{
    const path = req.body.path;
    const title = req.body.title;
    const subTitle = req.body.subtitle
    const id = req.body.id;

    const sql = "UPDATE categories SET img=?,title = ?,sub_title=? WHERE id = ?"
    db.query(sql,[path,title,subTitle,id],(err,data)=>{
        if(err){
            console.log(err);
            res.send(err)
            
        }


        if(data){
            res.json({res:"ok"})
        }


    })


})

app.post("/categoryById",(req,res)=>{

    const id = req.body.id;
    

    const sql = "SELECT * FROM categories WHERE id = ?"
    db.query(sql,[id],(err,data)=>{
        if(err){
            console.log(err);
            res.send(err)
            
        }


        if(data.length === 1){
            res.json({res:"ok",data:data})
        }else{
            res.json({res:"bad"})
        }


    })


})

app.get("/categories",(req,res)=>{


    const sql = "SELECT * FROM categories"
    db.query(sql,(err,data)=>{
        if(err){
            console.log(err);
            res.send(err)
            
        }


        if(data){
            res.json({res:"ok",data:data})
        }


    })


})



app.post("/isDashlogin",(req,res)=>{
    const token = req.body.token;

    jwt.verify(token,process.env.Dash_Token,(err,user)=>{
        if(err){
            res.send(JSON.stringify({res:"bad",islogin:false}))
        }
        
        if(user){
            res.send(JSON.stringify({res:"ok",islogin:true}))
        }

    })

})


app.post("/login",(req,res)=>{
  
    const username = req.body.username;
    const password = req.body.password;


    if(username.length > 0 && password.length > 0){
        const sql = "SELECT * FROM users WHERE username = ?"

        db.query(sql,[username],(err,data)=>{
            if(err){
                console.log(err);
                res.send(err);
            }

            if(data.length === 1){
                const hashed_password = data[0].password;
                

                if(bcrypt.compareSync(password,hashed_password)){


                    const user = {username:username}
                    const token = jwt.sign(user,process.env.Token)
                    
                    res.status(200).send(JSON.stringify({res:"ok",user:user,token:token}))

                }else{
                    res.status(401).send(JSON.stringify({res:"bad",msg:"اسم المستخدم او كلمة المرور غير صحيحة"}))
                }


               
            }else{
                res.status(401).send(JSON.stringify({res:"bad",msg:"اسم المستخدم او كلمة المرور غير صحيحة"}))
            }

        })

    }else{
        res.status(400).send(JSON.stringify({res:"bad",msg:"لا يمكنك ترك اي حقل فارغ"}))
    }

})

app.post("/loginDash",(req,res)=>{
  
    const email = req.body.email;
    const password = req.body.password;


    if(email.length > 0 && password.length > 0){
        const sql = "SELECT * FROM admins WHERE email = ?"

        db.query(sql,[email],(err,data)=>{
            if(err){
                console.log(err);
                res.send(err);
            }

            if(data.length === 1){
                const hashed_password = data[0].password;
                

                if(bcrypt.compareSync(password,hashed_password)){


                    const user = {username:data[0].username}
                    const token = jwt.sign(user,process.env.Dash_Token)
                    
                    res.status(200).send(JSON.stringify({res:"ok",user:user,token:token}))

                }else{
                    res.status(401).send(JSON.stringify({res:"bad",msg:"البريد الالكتروني او كلمة المرور غير صحيحة"}))
                }


               
            }else{
                res.status(401).send(JSON.stringify({res:"bad",msg:"البريد الالكتروني او كلمة المرور غير صحيحة"}))
            }

        })

    }else{
        res.status(400).send(JSON.stringify({res:"bad",msg:"لا يمكنك ترك اي حقل فارغ"}))
    }

})



app.post("/signup",(req,res)=>{

    const username = req.body.username;
    const password = req.body.password;

    if(username.length > 0 && password.length > 0){
        const sql = "SELECT * FROM users WHERE username = ?"

        db.query(sql,[username],(err,data)=>{
            if(err){
                console.log(err);
               return res.send(err);
            }

            if(data.length !== 1){

                bcrypt.hash(password,saltRounds,(err,hash)=>{
                    if(err){
                        console.log(err);
                       return res.send(err);
                    }


                    const img = "imgs/pic.png"
                    const time =  new Date().toLocaleString();

                    const sql = "INSERT INTO users(img,username,password,date) VALUES (?,?,?,?)"
                    db.query(sql,[img,username,hash,time],(err,data)=>{
                        if (err) {
                            console.log(err);
                           return res.send(err);
                        }
                        if(data){

    
                            const user = {username:username}
                            const token = jwt.sign(user,process.env.Token)
                           return res.status(200).send(JSON.stringify({res:"ok",user:user,token:token}))
            

                            
                        }else{
                           return res.status(500).send(JSON.stringify({res:"bad",msg:"حدث خطا ما اثناء التسجيل"}))
                        }

                    })



                })

                
                




               
            }else{
                res.status(400).send(JSON.stringify({res:"bad",msg:"اسم المستخدم مستخدم من قبل"}))
            }

        })

    }else{
        res.status(400).send(JSON.stringify({res:"bad",msg:"لا يمكنك ترك اي حقل فارغ"}))
    }

})
