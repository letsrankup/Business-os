"use client";

import { useState } from "react";

export default function CompetitorForm() {

const [website,setWebsite] = useState("");
const [competitor,setCompetitor] = useState("");

const submit = async()=>{

const res = await fetch("/api/competitor",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
website,
competitor
})
});

const data = await res.json();

console.log(data);

};

return (

<div className="space-y-4">

<input
placeholder="Your Website"
className="w-full border p-3"
onChange={(e)=>setWebsite(e.target.value)}
/>

<input
placeholder="Competitor Website"
className="w-full border p-3"
onChange={(e)=>setCompetitor(e.target.value)}
/>

<button
onClick={submit}
className="bg-green-500 px-4 py-2 rounded"
>
Analyze
</button>

</div>

);
}
