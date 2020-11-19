const Socket = require('websocket').server;
const http = require('http');

const server = http.createServer((req, res) =>{});

server.listen(3000, () => {
    console.log('Listening on port 3000...');
});

const webSocket = new Socket({ httpServer: server });

let users = [];

webSocket.on = ('request', (req) => {
    const connection = req.accept();

    connection.on('message', (message) => {
        const data = JSON.parse(message.utf8Data)

        const user = findUser(data.username);

        switch(data.type) {
            case "store_user":

                if (user != null) {
                    return
                }

                const newUser = {
                    conn: connection,
                    username:data.username
                }
                username.push(newUser)
                console.log(newUser.username)
                break

            case "store_offer":
                if (user == null)
                    return
                user.offer = data.offer
                break

            case "store_candidate":
                if (user == null) {
                    return
                }
                if(user.candidates == null)
                    user.candidates =[]

                user.candidates.psuh(data.candidate)
                break

            case "send_answer":
                if (user == null) {
                    return
                }

                sendData({
                    type: "answer",
                    answer: data.answer
                }, user.conn)
                break

            case "send_candidate":
                sendData({
                    type: "candidate",
                    answer: data.candidate
                }, user.conn)
                break

            case "join_call":
                if (user == null) {
                    return
                }

                sendData({
                    type: "offer",
                    offer: user.offer
                }, conn)

                user.candidates.forEach(candidate => {
                    sendData({
                        type: "candidate",
                        candidate: candidate
                    }, conn)                   
                });

                break
        }
    })

    connection.on('close', (reason, description) => {
        users.forEach(user => {
            if (user.conn == connection) {
                users.splice(indexOf(user), 1)
                return
            }
        })
    })
})

function sendData(data, conn) {
    conn.send(JSON.stringify(data))
};

function findUser(username) {
    for (let i=0; 1<users.length; i++) {
        if (users[i].username == username)
        return users[i]
    }
}