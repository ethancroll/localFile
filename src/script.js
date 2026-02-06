// Simple file upload and download functionality for local network
// Keep it super simple - no HTTPS, just basic functionality

document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality (moved from HTML)
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`${tabName}-panel`).classList.add('active');
        });
    });

    // File upload functionality
    const uploadBox = document.querySelector('.upload-box');
    
    if (uploadBox) {
        // Handle drag and drop
        uploadBox.addEventListener('dragover', handleDragOver);
        uploadBox.addEventListener('dragenter', handleDragEnter);
        uploadBox.addEventListener('dragleave', handleDragLeave);
        uploadBox.addEventListener('drop', handleDrop);
        
        // Handle click to upload
        uploadBox.addEventListener('click', handleClick);
    }

    function handleDragOver(e) {
        e.preventDefault();
        uploadBox.classList.add('dragover');
    }

    function handleDragEnter(e) {
        e.preventDefault();
        uploadBox.classList.add('dragover');
    }

    function handleDragLeave(e) {
        if (!uploadBox.contains(e.relatedTarget)) {
            uploadBox.classList.remove('dragover');
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        uploadBox.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    }

    function handleClick() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.addEventListener('change', function() {
            const files = Array.from(input.files);
            handleFiles(files);
        });
        input.click();
    }

    function handleFiles(files) {
        if (files.length === 0) return;
        
        // Upload files to server
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });
        
        // Show uploading status
        const uploadBox = document.querySelector('.upload-box');
        const originalText = uploadBox.innerHTML;
        uploadBox.innerHTML = '<p>Uploading...</p>';
        
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                uploadBox.innerHTML = '<p style="color: green;">✓ Upload successful!</p>';
                updateDownloadList();
            } else {
                uploadBox.innerHTML = '<p style="color: red;">Upload failed</p>';
            }
            
            setTimeout(() => {
                uploadBox.innerHTML = originalText;
            }, 2000);
        })
        .catch(error => {
            console.error('Upload error:', error);
            uploadBox.innerHTML = '<p style="color: red;">Upload failed</p>';
            setTimeout(() => {
                uploadBox.innerHTML = originalText;
            }, 2000);
        });
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function updateDownloadList() {
        fetch('/files')
        .then(response => response.json())
        .then(files => {
            const downloadPanel = document.getElementById('download-panel');
            
            if (files.length === 0) {
                downloadPanel.innerHTML = '<div class="file-item"><span class="file-name">No files uploaded yet</span></div>';
                return;
            }
            
            downloadPanel.innerHTML = '';
            
            files.forEach((file, index) => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.innerHTML = `
                    <div class="file-info">
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${formatFileSize(file.size)}</div>
                    </div>
                    <div class="file-actions">
                        <button class="download-btn" onclick="downloadFile('${file.name}')">Download</button>
                        <button class="delete-btn" onclick="deleteFile('${file.name}')">Delete</button>
                    </div>
                `;
                downloadPanel.appendChild(fileItem);
            });
        })
        .catch(error => {
            console.error('Error fetching files:', error);
        });
    }

    // Make functions global so buttons can access them
    window.downloadFile = function(filename) {
        window.open(`/download/${filename}`, '_blank');
    };

    window.deleteFile = function(filename) {
        if (confirm('Delete this file?')) {
            fetch(`/delete/${filename}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateDownloadList();
                } else {
                    alert('Failed to delete file');
                }
            })
            .catch(error => {
                console.error('Delete error:', error);
                alert('Failed to delete file');
            });
        }
    };

    // Initialize download list on page load
    updateDownloadList();
});