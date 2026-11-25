const os=require('node:os');const original=os.userInfo;os.userInfo=(...args)=>{try{return original(...args);}catch{return {uid:-1,gid:-1,username:'test-user',homedir:process.env.TEMP,shell:null};}};
