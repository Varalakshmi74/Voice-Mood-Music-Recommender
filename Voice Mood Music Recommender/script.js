// MoodTune AI - Voice Mood Music Recommender
// script.js

document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("startRecording");
    const stopBtn = document.getElementById("stopRecording");
    const analyzeBtn = document.getElementById("analyzeMood");
    const textAnalyzeBtn = document.getElementById("analyzeText");
    const textInput = document.getElementById("moodText");
    const uploadInput = document.getElementById("audioUpload");

    let recognition = null;
    let mediaRecorder = null;
    let audioChunks = [];
    let transcript = "";
    let isRecording = false;
    let recordingSeconds = 0;
    let timerInterval = null;

    // --------------------------------------------------
    // SONG DATABASE
    // --------------------------------------------------

    const songs = {
        Happy: [
            {
                title: "Happy",
                artist: "Pharrell Williams",
                emoji: "😊"
            },
            {
                title: "On Top of the World",
                artist: "Imagine Dragons",
                emoji: "🌎"
            },
            {
                title: "Good Life",
                artist: "OneRepublic",
                emoji: "✨"
            },
            {
                title: "Can't Stop the Feeling",
                artist: "Justin Timberlake",
                emoji: "🎉"
            }
        ],

        Sad: [
            {
                title: "Someone Like You",
                artist: "Adele",
                emoji: "💙"
            },
            {
                title: "Let Her Go",
                artist: "Passenger",
                emoji: "🌧️"
            },
            {
                title: "Lovely",
                artist: "Billie Eilish",
                emoji: "🌙"
            },
            {
                title: "Fix You",
                artist: "Coldplay",
                emoji: "💫"
            }
        ],

        Calm: [
            {
                title: "Perfect",
                artist: "Ed Sheeran",
                emoji: "🌿"
            },
            {
                title: "Yellow",
                artist: "Coldplay",
                emoji: "🌅"
            },
            {
                title: "Photograph",
                artist: "Ed Sheeran",
                emoji: "📸"
            },
            {
                title: "Until I Found You",
                artist: "Stephen Sanchez",
                emoji: "🌸"
            }
        ],

        Angry: [
            {
                title: "Believer",
                artist: "Imagine Dragons",
                emoji: "🔥"
            },
            {
                title: "Demons",
                artist: "Imagine Dragons",
                emoji: "⚡"
            },
            {
                title: "Numb",
                artist: "Linkin Park",
                emoji: "🎸"
            },
            {
                title: "Warriors",
                artist: "Imagine Dragons",
                emoji: "⚔️"
            }
        ],

        Stressed: [
            {
                title: "Weightless",
                artist: "Marconi Union",
                emoji: "🌊"
            },
            {
                title: "Ocean Eyes",
                artist: "Billie Eilish",
                emoji: "🌊"
            },
            {
                title: "A Sky Full of Stars",
                artist: "Coldplay",
                emoji: "⭐"
            },
            {
                title: "River Flows in You",
                artist: "Yiruma",
                emoji: "🎹"
            }
        ],

        Energetic: [
            {
                title: "Believer",
                artist: "Imagine Dragons",
                emoji: "⚡"
            },
            {
                title: "Thunder",
                artist: "Imagine Dragons",
                emoji: "🌩️"
            },
            {
                title: "Dance Monkey",
                artist: "Tones and I",
                emoji: "💃"
            },
            {
                title: "Uptown Funk",
                artist: "Bruno Mars",
                emoji: "🕺"
            }
        ],

        Romantic: [
            {
                title: "Perfect",
                artist: "Ed Sheeran",
                emoji: "❤️"
            },
            {
                title: "All of Me",
                artist: "John Legend",
                emoji: "💕"
            },
            {
                title: "Until I Found You",
                artist: "Stephen Sanchez",
                emoji: "🌹"
            },
            {
                title: "Love Story",
                artist: "Taylor Swift",
                emoji: "💗"
            }
        ]
    };

    // --------------------------------------------------
    // MOOD KEYWORDS
    // --------------------------------------------------

    const moodKeywords = {
        Happy: [
            "happy",
            "amazing",
            "great",
            "wonderful",
            "excited",
            "awesome",
            "good",
            "joy",
            "fun",
            "smile",
            "love"
        ],

        Sad: [
            "sad",
            "lonely",
            "cry",
            "crying",
            "depressed",
            "hurt",
            "alone",
            "unhappy",
            "broken",
            "miss"
        ],

        Angry: [
            "angry",
            "hate",
            "irritated",
            "frustrated",
            "annoying",
            "annoyed",
            "mad",
            "fight",
            "stupid"
        ],

        Calm: [
            "calm",
            "peaceful",
            "relaxed",
            "quiet",
            "comfortable",
            "peace",
            "chill",
            "relax"
        ],

        Stressed: [
            "stress",
            "stressed",
            "exam",
            "pressure",
            "tired",
            "worried",
            "deadline",
            "anxiety",
            "busy",
            "tension"
        ],

        Energetic: [
            "energy",
            "energetic",
            "workout",
            "party",
            "dance",
            "active",
            "power",
            "sport",
            "run"
        ],

        Romantic: [
            "romantic",
            "romance",
            "love",
            "lover",
            "relationship",
            "boyfriend",
            "girlfriend",
            "crush",
            "heart"
        ]
    };

    // --------------------------------------------------
    // UTILITY
    // --------------------------------------------------

    function getElement(...ids) {
        for (const id of ids) {
            const element = document.getElementById(id);
            if (element) return element;
        }
        return null;
    }

    function showToast(message) {
        let toast = document.getElementById("toast");

        if (!toast) {
            toast = document.createElement("div");
            toast.id = "toast";
            toast.style.position = "fixed";
            toast.style.bottom = "30px";
            toast.style.right = "30px";
            toast.style.padding = "14px 22px";
            toast.style.borderRadius = "14px";
            toast.style.background = "rgba(20,20,30,0.95)";
            toast.style.color = "#fff";
            toast.style.zIndex = "99999";
            toast.style.boxShadow = "0 10px 30px rgba(0,0,0,0.4)";
            toast.style.transition = "0.3s";
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.style.opacity = "1";

        setTimeout(() => {
            toast.style.opacity = "0";
        }, 2500);
    }

    // --------------------------------------------------
    // TIMER
    // --------------------------------------------------

    function startTimer() {
        recordingSeconds = 0;

        const timer = getElement(
            "recordingTimer",
            "timer",
            "recordTimer"
        );

        timerInterval = setInterval(() => {
            recordingSeconds++;

            const minutes = Math.floor(recordingSeconds / 60)
                .toString()
                .padStart(2, "0");

            const seconds = (recordingSeconds % 60)
                .toString()
                .padStart(2, "0");

            if (timer) {
                timer.textContent = `${minutes}:${seconds}`;
            }
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    // --------------------------------------------------
    // SPEECH RECOGNITION
    // --------------------------------------------------

    function setupSpeechRecognition() {
        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            showToast("Speech recognition is not supported in this browser.");
            return null;
        }

        const rec = new SpeechRecognition();

        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-IN";

        rec.onstart = () => {
            isRecording = true;

            const status = getElement(
                "recordingStatus",
                "status",
                "voiceStatus"
            );

            if (status) {
                status.textContent = "🎙️ Listening...";
            }
        };

        rec.onresult = (event) => {
            let finalText = "";

            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {
                finalText += event.results[i][0].transcript;
            }

            transcript = finalText;

            const speechText = getElement(
                "speechText",
                "transcript",
                "detectedSpeech"
            );

            if (speechText) {
                speechText.textContent = transcript;
            }

            if (textInput && !textInput.value) {
                textInput.value = transcript;
            }
        };

        rec.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            showToast("Could not recognize speech. Try again.");
        };

        rec.onend = () => {
            if (isRecording) {
                try {
                    rec.start();
                } catch (error) {
                    console.log(error);
                }
            }
        };

        return rec;
    }

    // --------------------------------------------------
    // START RECORDING
    // --------------------------------------------------

    async function startRecording() {
        if (isRecording) return;

        transcript = "";

        if (!recognition) {
            recognition = setupSpeechRecognition();
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });

            audioChunks = [];

            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.start();

            if (recognition) {
                recognition.start();
            }

            isRecording = true;

            startTimer();

            const start = getElement(
                "startRecording",
                "startBtn"
            );

            const stop = getElement(
                "stopRecording",
                "stopBtn"
            );

            if (start) start.disabled = true;
            if (stop) stop.disabled = false;

            showToast("🎙️ Recording started");
        } catch (error) {
            console.error(error);
            showToast("Microphone permission is required.");
        }
    }

    // --------------------------------------------------
    // STOP RECORDING
    // --------------------------------------------------

    function stopRecording() {
        if (!isRecording) return;

        isRecording = false;

        stopTimer();

        if (recognition) {
            try {
                recognition.stop();
            } catch (error) {
                console.log(error);
            }
        }

        if (mediaRecorder) {
            mediaRecorder.stop();

            mediaRecorder.stream
                .getTracks()
                .forEach(track => track.stop());

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, {
                    type: "audio/webm"
                });

                const audioURL = URL.createObjectURL(audioBlob);

                const audioPlayer = getElement(
                    "audioPlayer",
                    "recordedAudio"
                );

                if (audioPlayer) {
                    audioPlayer.src = audioURL;
                    audioPlayer.style.display = "block";
                }
            };
        }

        const start = getElement(
            "startRecording",
            "startBtn"
        );

        const stop = getElement(
            "stopRecording",
            "stopBtn"
        );

        if (start) start.disabled = false;
        if (stop) stop.disabled = true;

        const status = getElement(
            "recordingStatus",
            "status",
            "voiceStatus"
        );

        if (status) {
            status.textContent = "Recording completed";
        }

        showToast("✅ Recording completed");
    }

    // --------------------------------------------------
    // MOOD DETECTION
    // --------------------------------------------------

    function detectMood(text) {
        const lowerText = text.toLowerCase();

        const scores = {};

        Object.keys(moodKeywords).forEach(mood => {
            scores[mood] = 0;

            moodKeywords[mood].forEach(keyword => {
                const regex = new RegExp(
                    "\\b" + keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b",
                    "gi"
                );

                const matches = lowerText.match(regex);

                if (matches) {
                    scores[mood] += matches.length;
                }
            });
        });

        let detectedMood = "Calm";
        let highestScore = 0;

        Object.keys(scores).forEach(mood => {
            if (scores[mood] > highestScore) {
                highestScore = scores[mood];
                detectedMood = mood;
            }
        });

        let confidence;

        if (highestScore === 0) {
            confidence = 55;
            detectedMood = "Calm";
        } else {
            confidence = Math.min(
                95,
                60 + highestScore * 8
            );
        }

        return {
            mood: detectedMood,
            confidence,
            scores
        };
    }

    // --------------------------------------------------
    // UPDATE MOOD UI
    // --------------------------------------------------

    function updateMoodUI(result) {
        const mood = result.mood;
        const confidence = result.confidence;

        const moodEmoji = {
            Happy: "😊",
            Sad: "😢",
            Angry: "😡",
            Calm: "😌",
            Stressed: "😰",
            Energetic: "⚡",
            Romantic: "❤️"
        };

        const moodResult = getElement(
            "moodResult",
            "detectedMood",
            "currentMood"
        );

        const confidenceResult = getElement(
            "confidence",
            "moodConfidence"
        );

        const emoji = getElement(
            "moodEmoji",
            "emotionEmoji"
        );

        if (moodResult) {
            moodResult.textContent =
                `${moodEmoji[mood] || "😊"} ${mood.toUpperCase()}`;
        }

        if (confidenceResult) {
            confidenceResult.textContent =
                `${confidence}%`;
        }

        if (emoji) {
            emoji.textContent =
                moodEmoji[mood] || "😊";
        }

        const meter = getElement(
            "confidenceMeter",
            "moodMeter",
            "progressCircle"
        );

        if (meter) {
            meter.style.setProperty(
                "--progress",
                `${confidence * 3.6}deg`
            );
        }

        updateMoodBreakdown(result);
        showExplanation(result);
        displaySongs(mood);
        saveHistory(result);
    }

    // --------------------------------------------------
    // MOOD BREAKDOWN
    // --------------------------------------------------

    function updateMoodBreakdown(result) {
        const container = getElement(
            "moodBreakdown",
            "emotionBreakdown"
        );

        if (!container) return;

        container.innerHTML = "";

        Object.keys(result.scores).forEach(mood => {
            const score = result.scores[mood];

            const percentage =
                score === 0
                    ? 5
                    : Math.min(100, 40 + score * 12);

            const div = document.createElement("div");

            div.className = "mood-progress";

            div.innerHTML = `
                <div style="
                    display:flex;
                    justify-content:space-between;
                    margin-bottom:5px;
                ">
                    <span>${mood}</span>
                    <span>${percentage}%</span>
                </div>

                <div style="
                    height:7px;
                    background:rgba(255,255,255,0.1);
                    border-radius:20px;
                    overflow:hidden;
                ">
                    <div style="
                        width:${percentage}%;
                        height:100%;
                        background:linear-gradient(90deg,#ff4ecd,#7c5cff);
                        border-radius:20px;
                        transition:width 1s ease;
                    "></div>
                </div>
            `;

            container.appendChild(div);
        });
    }

    // --------------------------------------------------
    // AI EXPLANATION
    // --------------------------------------------------

    function showExplanation(result) {
        const explanation = getElement(
            "aiExplanation",
            "moodExplanation"
        );

        if (!explanation) return;

        const explanations = {
            Happy:
                "Your speech contains positive and cheerful expressions. AI detected a strong positive emotional pattern.",

            Sad:
                "Your speech contains words associated with loneliness, sadness or emotional difficulty.",

            Angry:
                "Your speech contains strong negative expressions that indicate frustration or anger.",

            Calm:
                "Your speech appears relaxed and balanced, indicating a calm emotional state.",

            Stressed:
                "Your speech contains words related to pressure, worry, deadlines or tiredness.",

            Energetic:
                "Your speech contains energetic and activity-related expressions.",

            Romantic:
                "Your speech contains affectionate and relationship-related expressions."
        };

        explanation.textContent =
            explanations[result.mood] ||
            explanations.Calm;
    }

    // --------------------------------------------------
    // DISPLAY SONGS
    // --------------------------------------------------

    function displaySongs(mood) {
        const container = getElement(
            "songRecommendations",
            "recommendations",
            "songList"
        );

        if (!container) return;

        container.innerHTML = "";

        const selectedSongs =
            songs[mood] || songs.Calm;

        selectedSongs.forEach((song, index) => {
            const card = document.createElement("div");

            card.className = "song-card";

            card.innerHTML = `
                <div class="album-art">
                    ${song.emoji}
                </div>

                <div class="song-info">
                    <h3>${song.title}</h3>
                    <p>${song.artist}</p>
                </div>

                <button
                    class="play-song"
                    data-index="${index}"
                    data-mood="${mood}"
                >
                    ▶
                </button>

                <button
                    class="like-song"
                    title="Like song"
                >
                    ♡
                </button>
            `;

            container.appendChild(card);
        });

        container
            .querySelectorAll(".play-song")
            .forEach(button => {
                button.addEventListener("click", () => {
                    const moodName = button.dataset.mood;
                    const index =
                        Number(button.dataset.index);

                    playSong(
                        songs[moodName][index]
                    );
                });
            });

        container
            .querySelectorAll(".like-song")
            .forEach(button => {
                button.addEventListener("click", () => {
                    button.textContent =
                        button.textContent === "♡"
                            ? "♥"
                            : "♡";
                });
            });
    }

    // --------------------------------------------------
    // MUSIC PLAYER
    // --------------------------------------------------

    let currentSong = null;
    let isPlaying = false;

    function playSong(song) {
        currentSong = song;
        isPlaying = true;

        const title = getElement(
            "playerTitle",
            "currentSongTitle"
        );

        const artist = getElement(
            "playerArtist",
            "currentSongArtist"
        );

        const album = getElement(
            "playerAlbum",
            "currentAlbum"
        );

        const playButton = getElement(
            "playerPlay",
            "playPause"
        );

        if (title) title.textContent = song.title;
        if (artist) artist.textContent = song.artist;
        if (album) album.textContent = song.emoji;

        if (playButton) {
            playButton.textContent = "⏸";
        }

        showToast(`▶ Playing ${song.title}`);
    }

    // --------------------------------------------------
    // TEXT ANALYSIS
    // --------------------------------------------------

    function analyzeText() {
        if (!textInput) return;

        const text = textInput.value.trim();

        if (!text) {
            showToast("Please enter some text first.");
            return;
        }

        const result = detectMood(text);

        updateMoodUI(result);

        const speechText = getElement(
            "speechText",
            "transcript",
            "detectedSpeech"
        );

        if (speechText) {
            speechText.textContent = text;
        }

        showToast(
            `Mood detected: ${result.mood}`
        );
    }

    // --------------------------------------------------
    // VOICE ANALYSIS
    // --------------------------------------------------

    function analyzeVoice() {
        const text =
            transcript ||
            (textInput ? textInput.value : "");

        if (!text.trim()) {
            showToast(
                "Please record your voice or enter text."
            );
            return;
        }

        const result = detectMood(text);

        updateMoodUI(result);

        showToast(
            `🤖 AI detected ${result.mood} mood`
        );
    }

    // --------------------------------------------------
    // AUDIO UPLOAD
    // --------------------------------------------------

    if (uploadInput) {
        uploadInput.addEventListener(
            "change",
            event => {
                const file =
                    event.target.files[0];

                if (!file) return;

                const url =
                    URL.createObjectURL(file);

                const player = getElement(
                    "audioPlayer",
                    "uploadedAudio"
                );

                if (player) {
                    player.src = url;
                    player.style.display = "block";
                    player.controls = true;
                }

                showToast(
                    `📁 ${file.name} uploaded successfully`
                );
            }
        );
    }

    // --------------------------------------------------
    // SAVE HISTORY
    // --------------------------------------------------

    function saveHistory(result) {
        let history =
            JSON.parse(
                localStorage.getItem(
                    "moodTuneHistory"
                ) || "[]"
            );

        history.unshift({
            mood: result.mood,
            confidence: result.confidence,
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString()
        });

        history = history.slice(0, 20);

        localStorage.setItem(
            "moodTuneHistory",
            JSON.stringify(history)
        );

        renderHistory();
    }

    // --------------------------------------------------
    // HISTORY UI
    // --------------------------------------------------

    function renderHistory() {
        const container = getElement(
            "historyList",
            "moodHistory"
        );

        if (!container) return;

        const history =
            JSON.parse(
                localStorage.getItem(
                    "moodTuneHistory"
                ) || "[]"
            );

        container.innerHTML = "";

        if (history.length === 0) {
            container.innerHTML =
                "<p>No mood analysis history yet.</p>";
            return;
        }

        history.forEach(item => {
            const row =
                document.createElement("div");

            row.className = "history-row";

            row.innerHTML = `
                <span>${item.date}</span>
                <strong>${item.mood}</strong>
                <span>${item.confidence}%</span>
                <span>${item.time}</span>
            `;

            container.appendChild(row);
        });
    }

    // --------------------------------------------------
    // CLEAR HISTORY
    // --------------------------------------------------

    const clearHistoryBtn = getElement(
        "clearHistory"
    );

    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener(
            "click",
            () => {
                localStorage.removeItem(
                    "moodTuneHistory"
                );

                renderHistory();

                showToast(
                    "History cleared successfully."
                );
            }
        );
    }

    // --------------------------------------------------
    // EVENT LISTENERS
    // --------------------------------------------------

    if (startBtn) {
        startBtn.addEventListener(
            "click",
            startRecording
        );
    }

    if (stopBtn) {
        stopBtn.disabled = true;

        stopBtn.addEventListener(
            "click",
            stopRecording
        );
    }

    if (analyzeBtn) {
        analyzeBtn.addEventListener(
            "click",
            analyzeVoice
        );
    }

    if (textAnalyzeBtn) {
        textAnalyzeBtn.addEventListener(
            "click",
            analyzeText
        );
    }

    // --------------------------------------------------
    // PLAYER BUTTON
    // --------------------------------------------------

    const playerPlay = getElement(
        "playerPlay",
        "playPause"
    );

    if (playerPlay) {
        playerPlay.addEventListener(
            "click",
            () => {
                if (!currentSong) {
                    showToast(
                        "Select a song first."
                    );
                    return;
                }

                isPlaying = !isPlaying;

                playerPlay.textContent =
                    isPlaying ? "⏸" : "▶";
            }
        );
    }

    // --------------------------------------------------
    // SEARCH
    // --------------------------------------------------

    const searchInput =
        document.getElementById("songSearch");

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            () => {
                const query =
                    searchInput.value.toLowerCase();

                document
                    .querySelectorAll(".song-card")
                    .forEach(card => {
                        const text =
                            card.textContent.toLowerCase();

                        card.style.display =
                            text.includes(query)
                                ? ""
                                : "none";
                    });
            }
        );
    }

    // --------------------------------------------------
    // INITIALIZATION
    // --------------------------------------------------

    renderHistory();

    // Default recommendation
    displaySongs("Happy");

    console.log(
        "🎧 MoodTune AI initialized successfully!"
    );
});