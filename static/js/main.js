document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.querySelector('.upload-box');
    const fileInput = document.getElementById('audioFile');
    const fileNameDisplay = document.getElementById('fileName');
    const loadingOverlay = document.getElementById('loading-overlay');
    const processBtn = document.getElementById('processBtn');

    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('highlight');
        dropZone.style.borderColor = '#8B5CF6';
        dropZone.style.backgroundColor = '#F3F4F6';
    }

    function unhighlight(e) {
        dropZone.classList.remove('highlight');
        dropZone.style.borderColor = '#CBD5E0';
        dropZone.style.backgroundColor = '#FFFFFF';
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        if (files.length) {
            const file = files[0];
            if (file.type === 'audio/wav') {
                fileInput.files = files;
                updateFileName(file.name);
                showNotification('File uploaded successfully!', 'success');
            } else {
                showNotification('Please upload a WAV file', 'error');
            }
        }
    }

    fileInput.addEventListener('change', function(e) {
        if (this.files.length) {
            const file = this.files[0];
            if (file.type === 'audio/wav') {
                updateFileName(file.name);
                showNotification('File selected successfully!', 'success');
            } else {
                this.value = '';
                showNotification('Please select a WAV file', 'error');
            }
        }
    });

    function updateFileName(name) {
        fileNameDisplay.textContent = name;
        fileNameDisplay.style.color = '#4B5563';
        processBtn.disabled = false;
    }

    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // Process audio functionality
    processBtn.addEventListener('click', processAudio);

    async function processAudio() {
        const audioFile = fileInput.files[0];
        
        if (!audioFile) {
            showNotification('Please select an audio file', 'error');
            return;
        }

        loadingOverlay.classList.remove('hidden');
        processBtn.disabled = true;

        const formData = new FormData();
        formData.append('audio', audioFile);

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            displayResults(data);
            showNotification('Audio processed successfully!', 'success');
        } catch (error) {
            console.error('Error:', error);
            showNotification(`Error: ${error.message}`, 'error');
        } finally {
            loadingOverlay.classList.add('hidden');
            processBtn.disabled = false;
        }
    }

    function displayResults(data) {
        // Clear previous results
        clearResults();

        // Animate results appearance
        const resultBoxes = document.querySelectorAll('.result-box');
        resultBoxes.forEach((box, index) => {
            setTimeout(() => {
                // Initial state
                box.style.opacity = '0';
                box.style.transform = 'translateY(20px)';
                
                // Update content based on box ID
                const content = box.querySelector('.content');
                switch(box.id) {
                    case 'transcript':
                        content.innerHTML = `
                            <div class="transcript-text">
                                ${data.transcript || 'No transcript available'}
                            </div>
                        `;
                        break;

                    case 'meetingDetails':
                        const dates = data.meeting_details.dates;
                        const times = data.meeting_details.times;
                        content.innerHTML = `
                            <div class="meeting-details">
                                <div class="detail-item">
                                    <i class="fas fa-calendar"></i>
                                    <span>Dates: ${dates.length ? dates.join(', ') : 'None detected'}</span>
                                </div>
                                <div class="detail-item">
                                    <i class="fas fa-clock"></i>
                                    <span>Times: ${times.length ? times.join(', ') : 'None detected'}</span>
                                </div>
                            </div>
                        `;
                        break;

                    case 'actions':
                        content.innerHTML = data.actions.length ? `
                            <ul class="action-list">
                                ${data.actions.map(action => `
                                    <li>
                                        <i class="fas fa-check-circle"></i>
                                        <span>${action}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        ` : '<p>No action items detected</p>';
                        break;

                    case 'keyPoints':
                        content.innerHTML = data.key_points.length ? `
                            <ul class="key-points-list">
                                ${data.key_points.map(point => `
                                    <li>
                                        <i class="fas fa-star"></i>
                                        <span>${point}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        ` : '<p>No key points detected</p>';
                        break;
                }

                // Animate in
                requestAnimationFrame(() => {
                    box.style.opacity = '1';
                    box.style.transform = 'translateY(0)';
                    box.style.transition = 'all 0.5s ease-out';
                });
            }, index * 200); // Stagger the animations
        });
    }

    function clearResults() {
        const contents = document.querySelectorAll('.content');
        contents.forEach(content => {
            content.innerHTML = '';
        });
    }

    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);

        // Add animation class
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Remove notification after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
});