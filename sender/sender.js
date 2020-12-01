const webSocket = new WebSocket("ws://127.0.0.1:3000");

// When the other client sends their offer and their ice candidates to us
// we have to accept that and give it to the peer connection so that the connection is established.
// Whenever there is a message fro the server to the websocket, below function is called
webSocket.onmessage = (event) => {
    // event.data represents all the signalling data getting off the candidate
    handleSignallingData(JSON.parse(event.data)) 
}

function handleSignallingData(data) {
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
        type: "store_user"
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
    
    // Get video stream from device and show that video stream in the local video element
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

        // Configuration to be used to generate the icecandidates and to connect to the peer.
        
        let configuration = {
            // Check for functional stun servers at https://gist.github.com/sagivo/3a4b2f2c7ac6e1b5267c2f1f59ac6c6b
            // or google webRTC stun / turn server list
            // copy and paste url of stun server to Trace ICE page at https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
            // to confirm server is working. On the Trace ICE page, first remove existing server by selecting it and clicking remove server. 
            //Then paste new server on the STUN or TURN URI field. add stun: at the beginning of the link to look like stun:stun.l.google.com:19302
            // Click on add server then click on gather candidates. If the type of the candidxate returned has srflx, then the server can be used.
            iceServers: [
                {
                    "urls": ["stun:stun.l.google.com:19302",
                        "stun:stun1.l.google.com:19302",
                        "stun:stun2.l.google.com:19302"]
                }
            ]
        }

        // Establish a peer connection to attach local stream. When a peer connects to our peer, the stream will be available to 
        // that person through a simple function that is available in the WebRTC API.
        peerConn = new RTCPeerConnection(configuration)
        
        // Attach stream to peer connection
        peerConn.addStream(localStream)

        //After peer connection is establisehd, this function is called
        peerConn.onaddStream = (e) => {

            // Show remote stream in remote video element
            document.getElementById("remote-video").srcObject = e.stream;
        }

        // As soon as offer is created(see below), the peer connection starts gathering 
        // the ice candidates which need to be sent to the server. The server will send 
        // the candidates to the person trying to connect to us. With the candidates, we
        // can make the connection happen. We send the icecandidate to the server using 
        // the onicecandidate function call
        peerConn.onicecandidate = (e) => {
            if(e.candidate == null)
            return;
            sendData({
                type: "store_candidate",
                candidate: e.candidate
            })
        }

        createAndSendOffer()

    }, (error) => {
        console.log(error);
    })
}

// Create and send offer which is stored in socket server. When someone connects with us,
// the server sends the offer to that person and get that person`s answer and returns the 
// answer to us for storage in the peer connection. 
function createAndSendOffer() {
    peerConn.createOffer((offer) => {
        // Send offer to the server
        sendData({
            type: "store_offer",
            offer: offer
        })
        // Set description of remote peer connection
        peerConn.setLocalDescription(offer)
    }, (error) => {
        console.log(error);
    })   
}

let isAudio = true;
function muteAudio() {
    isAudio = !isAudio;
    localStream.getAudioTracks()[0].enabled = isAudio;
}

let isVideo = true;
function muteVideo() {
    isVideo = !isVideo;
    localStream.getVideoTracks()[0].enabled = isVideo;
}