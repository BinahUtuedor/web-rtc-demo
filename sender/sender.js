const webSocket = new WebSocket("ws://127.0.0.1:3000");
webSocket.onmessage = (event) => {
    handleSignallingData(JSON.parse(event.data)) 
}

function handleSignallingData() {
    switch (data.type) {
        case "answer":
            peerConn.setRemoteDescription(data.answer)
            break
        case "candidate":
            peerConn.addIceCandidate(data.candidate)
    }
}

let username;
function sendUsername() {
    username = document.getElementById("username-input").value;
    sendData({
        type: "store_user",
    })
}

function sendData(data) {
    data.username = username
    webSocket.send(JSON.stringify(data))
}

let localStream;
let peerConn;
function startCall() {
    document.getElementById("video-call-div").style.display = "inline"

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
            // Check for functional servers at https://gist.github.com/sagivo/3a4b2f2c7ac6e1b5267c2f1f59ac6c6b
            // or google webRTC stun / turn server list
            // copy and past server Trace ICE page at https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
            // to confirm server is working

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
            document.getElementById("remote-video").srcObject = e.stream;
        }

        peerConn.onicecandidate = ((e) => {
            if(e.candidate == null)
            return;
            sendData({
                type: "store_candidate",
                candidate: e.candidate
            })
        })

        createAndSendOffer()

    }, (error) => {
        console.log(error);
    })
}

function createAndSendOffer() {
    peerConn.createOffer((offer) => {
        sendData({
            type: "store_offer",
            offer: offer
        })

        peerConn.setLocalDescription(offer)
    }, (error) => {
        console.log(error);
    })   
}