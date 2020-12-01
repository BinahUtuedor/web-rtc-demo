const webSocket = new WebSocket("ws://127.0.0.1:3000");
webSocket.onmessage = (event) => {
    handleSignallingData(JSON.parse(event.data)) 
}

function handleSignallingData(data) {
    switch (data.type) {
        case "offer":
            peerConn.setRemoteDescription(data.offer)
            createAndSendAnswer()
            break
        case "candidate":
            peerConn.addIceCandidate(data.candidate)
    }
}

function createAndSendAnswer() {
    peerConn.createAnswer((answer) => {
        peerConn.setLocalDescription(answer)
        sendData({
            type: "send_answer",
            answer: answer
        })
    }, error => {
        console.log(error);
    }) 
}

function sendData(data) {
    data.username = username
    webSocket.send(JSON.stringify(data))
}

let localStream;
let peerConn;
let username;

function joinCall() {
    username = document.getElementById("username-input").value;
    document.getElementById("video-call-div")
    .style.display = "inline"

    navigator.getUserMedia({
        video: {
            frameRate: 24,
            width: {
                min: 480, ideal: 720, max: 1280
            },
            aspectRatio: 1.33333
        },
        audio: true
    }, (stream) => {
        localStream = stream;
        document.getElementById("local-video").srcObject = localStream;

        let configuration = {
            // Check for functional stun servers at https://gist.github.com/sagivo/3a4b2f2c7ac6e1b5267c2f1f59ac6c6b
            // or google webRTC stun / turn server list
            // copy and paste url of stun server to Trace ICE page at https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
            // to confirm server is working. On the Trace ICE page, first remove existing server by selecting it and clicking remove server. 
            //Then paste new server on the STUN or TURN URI field. add stun: at the beginning of the link to look like stun:stun.l.google.com:19302
            // Click on add server then click on gather candidates. If the type of the candidxate returned has srflx, then the server can be used.

            iceService: [
                {
                    "urls": [
                        "stun.l.google.com:19302",
                        "stun1.l.google.com:19302",
                        "stun2.l.google.com:19302"
                    ]
                }
            ]
        }

        peerConn = new RTCPeerConnection(configuration)
        peerConn.addStream(localStream)

        peerConn.onaddstrean = (e) => {
            document.getElementById("remote-video")
            .srcObject = e.stream;
        }

        peerConn.onicecandidate = ((e) => {
            if(e.candidate == null)
            return;
            
        sendData({
            type: "send_candidate",
            candidate: e.candidate
        })
    })
        
    sendData({
        type: "join_call"
    })

    }, (error) => {
        console.log(error);
    })
}


let isAudio = true;
function muteAudio() {
    isAudio = !isAudio;
    localStream.getAudioTracks()[0].enabled =isAudio;
}

let isVideo = true;
function muteVideo() {
    isVideo = !isVideo;
    localStream.getVideoTracks()[0].enabled =isVideo;
}