const server = Bun.serve({
    port: 3000,
    fetch(request, server) {
        const url = new URL(request.url);
        console.log(url);
        switch (request.url) {
            case 'http://localhost:3000/home':
                return new Response("Welcome to the Home" + request.url);
            case 'http://localhost:3000/register':
                return new Response("Welcome to the Register" + request.url);
            default:
                return new Response("Welcome to the Root" + request.url);
        }
    }
})
console.log(server.port);
