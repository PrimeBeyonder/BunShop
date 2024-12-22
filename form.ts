const formHTML = await Bun.file("./form.html").text();

const server = Bun.serve({
    port: 3000,
   async fetch(request, server){
        const url = new URL(request.url);
        const method = request.method;
        if(url.pathname === "/"){
            return new Response(
                formHTML,
                {
                    headers: {
                        "content-type": "text/html; charset=utf-8",
                    }
                }
            );

        }
        else if (url.pathname === "/data" && method === "POST"){
            const data = await request.text().then((data) =>{
                const params = new URLSearchParams(data);
                return params;
            });
            console.log(data);
            return new Response("POST Request Made")
        }
        else {
            return new Response("Hello World!");
        }
    },
});
console.log(`Listening on ${server.url}`);
