async function accessToken(code){
    var clientId = process.env.CLIENT_ID;
    var clientSecret = process.env.CLIENT_SECRET;
    const res = await Axios.post('https://github.com/login/oauth/access_token',
    {
        client_id:clientId,
        client_secret:clientSecret,
        code:code
    },{
        headers:{
            "Content-Type":"application/json",
            "Accept":"application/json"
        },
    });
    // console.log(res);
    return res.data.access_token;
}


app.get('/github/callback',async(req,res)=>{
    const code = req.query.code;
    const token = await accessToken(code);
    const githubdata = await getGitHubUser(token);
    if(githubdata){
        req.session.user = githubdata;
        req.session.githubId = githubdata.id;
        req.session.token = token;
        console.log(githubdata);
        console.log("githubdata.id: "+githubdata.id);
        console.log("token: "+token);
        res.redirect('/home');
    }else{
        res.send("error");
    }
})

app.get('/login/github',(req,res)=>{
    const url = `https://github.com/login/oauth/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=http://localhost:8000/github/callback`;
    res.redirect(url)
})

async function getGitHubUser(token){
    const user = await Axios.get('https://api.github.com/user',{
        headers:{
            Authorization:`bearer ${token}`
        }
    });
    // console.log(user.data);
    return user.data;
} 