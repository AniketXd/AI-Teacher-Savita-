import { useState, useEffect, useRef } from 'react';

function App() {
    // Call Button
    const [callActive, setCallActive] = useState(false);

    // Caller Information
    const [callerName, setCallerName] = useState('');
    const [callerPhoneNumber, setCallerPhoneNumber] = useState('');
    
    // User Speech Recognition
    const recognitionRef = useRef(null);

    // Tracker for AI Speaking
    const speakingRef = useRef(false);

    // Initialize Speech Recognition
    useEffect(() => {
        if (callActive) {
            if (!window.speechRecognition && !window.webkitSpeechRecognition) {
                alert('Your browser does not support speech recognition.');
                return;
            }

            // Initializing Speech Recognition
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;

            recognitionRef.current.onresult = (event) => {
                const userInput = event.results[event.results.length - 1][0].transcript;
                console.log('User Input', userInput);

                if (userInput) {
                    const myHeaders = new Headers();
                    myHeaders.append('x-api-key', import.meta.env.VITE_APP_API_KEY);
                    myHeaders.append('Content-Type', 'application/json');

                    // Set Speaking of AI to true
                    speakingRef.current = true; // Set speaking flag
                    // Stop Speech Recognition
                    recognitionRef.current.stop(); // Stop recognition before speaking

                    const makeChunksOfText = (text) => {
                        const maxLength = 190;
                        let speechChunks = [];

                        // Split the text into chunks of maximum length maxlength without breaking words
                        while (text.length > 0) {
                            if (text.length <= maxLength) {
                                speechChunks.push(text);
                                break;
                            }

                            let chunk = text.substring(0, maxLength + 1);

                            let lastSpaceIndex = chunk.lastIndexOf(' ');
                            if (lastSpaceIndex !== -1) {
                                speechChunks.push(text.substring(0, lastSpaceIndex));
                                text = text.substring(lastSpaceIndex + 1);
                            } else {
                                // If there are no spaces in the chunks, split at the maxLength
                                speechChunks.push(text.substring(0, maxLength));
                                text = text.substring(maxLength);
                            }
                        }

                        return speechChunks;
                    };

                    const speak = async (text) => {
                        const speechChunks = makeChunksOfText(text);
                        for (let i = 0; i < speechChunks.length; i++) {
                            await new Promise((resolve) => {
                                window.speechSynthesis.cancel();
                                let speech = new SpeechSynthesisUtterance(speechChunks[i]);
                                speech.rate = 1.1;
                                speech.lang = 'hi-IN';
                                window.speechSynthesis.speak(speech);
                                speech.onend = () => {
                                    resolve();
                                };
                                speech.onerror = () => {
                                    resolve();
                                };
                            });
                        }
                    };

                    // API REQUEST
                    const reqBody = JSON.stringify({
                        message: userInput
                    });

                    const requestOptions = {
                        method: 'POST',
                        headers: myHeaders,
                        body: reqBody,
                        redirect: 'follow'
                    };

                    fetch('http://localhost:3000/share-with-teacher', requestOptions)
                    .then((res) => res.text())
                    .then(async (aiResponse) => {
                        console.log('AI Response', aiResponse)
                        await speak(aiResponse)

                        // Set Speaking of AI to false
                        speakingRef.current = false; // Clear speaking flag
                        recognitionRef.current.start();
                    })
                    .catch(async (err) => {
                        console.error(err);
                        await speak(err.message);

                        // Set Speaking of AI to false
                        speakingRef.current = false; // Clear speaking flag
                        recognitionRef.current.start();
                    });
                }
            };

            recognitionRef.current.onerror = (event) => {
                if (event.error === 'no-speech') {
                    console.warn('No speech detected. Continuing...');
                } else {
                    console.error('Speech recognition error:', event.error);
                }

                alert('Call disconnected...');
                setCallActive(false);
            };

            // Starting Speech Recognition
            recognitionRef.current.start();
        } else {
            // Cancel Ongoing Speech
            window.speechSynthesis.cancel();

            if (recognitionRef.current) {
                // Stop and Abort Speech Recognition
                recognitionRef.current.abort();

                // Back to Null
                recognitionRef.current = null;
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
                recognitionRef.current = null;
            }
        };
    }, [callActive]);

    // Start Call
    const handleCallStart = (number, name) => {
        if (!number) {
            alert('Please enter a number');
            return;
        }
        if (number.length !== 10) {
            alert('Please enter a valid number');
            return;
        }
        setCallActive(true);
        setCallerPhoneNumber(number);
        setCallerName(name);
    };

    // End Call
    const handleEndCall = () => {
        setCallActive(false);
        setCallerPhoneNumber('');
        setCallerName('');
    };

    const handleButtonClick = (number) => {
        if (callerPhoneNumber.length < 10) {
            setCallerPhoneNumber(callerPhoneNumber + number);
        }
    };

    // Design
    return (
        <div className="app">
            {!callActive && (
                <div className="dialer-screen">
                    <div className="dialer-title">Dial Number</div>
                    <div className="phone-number-display">{callerPhoneNumber}</div>
                    <div className="dialer-buttons">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((num, i) => {
                            return (
                                <button
                                    key={i}
                                    onClick={() => handleButtonClick(num.toString())}>
                                    {num}
                                </button>
                            );
                        })}
                        <button
                            className="start-call-button"
                            onClick={() => handleCallStart(callerPhoneNumber, 'Savita Mam')}>
                            Start Call
                        </button>
                    </div>
                </div>
            )}
            {callActive && (
                <div className="call-screen">
                    <div className="call-info">
                        <div className="caller-details">
                            <div className="caller-name">{callerName}</div>
                            <div className="caller-phone-number">{callerPhoneNumber}</div>
                        </div>
                        <button
                            className="end-call-button"
                            onClick={handleEndCall}>
                            End Call
                        </button>
                    </div>
                </div>
            )}
        </div>
        
    );
}

export default App;
