export class ScoreSystem {
    constructor(totalPieces) {
        this.totalPieces = totalPieces; // Total number of puzzle pieces
        this.hitPieces = 0; // Counter for hit pieces

        this.createScoreDisplay();
    }

    // Function to create the score display elements
    createScoreDisplay() {
        // Create a container for the progress bar and score
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '20px';
        container.style.left = '20px';
        container.style.width = '300px';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.zIndex = '1000';

        // Create the progress bar
        this.progressBar = document.createElement('div');
        this.progressBar.style.flex = '1';
        this.progressBar.style.height = '20px';
        this.progressBar.style.background = '#ddd';
        this.progressBar.style.borderRadius = '5px';
        this.progressBar.style.overflow = 'hidden';

        const progressFill = document.createElement('div');
        progressFill.style.width = '0%';
        progressFill.style.height = '100%';
        progressFill.style.background = '#4caf50';
        progressFill.style.transition = 'width 0.3s ease';
        this.progressBar.appendChild(progressFill);
        this.progressFill = progressFill;

        // Create the score text
        this.scoreText = document.createElement('span');
        this.scoreText.style.marginLeft = '10px';
        this.scoreText.style.color = '#000';
        this.scoreText.style.fontSize = '16px';
        this.updateScoreText();

        // Append elements to the container
        container.appendChild(this.progressBar);
        container.appendChild(this.scoreText);

        // Add the container to the DOM
        document.body.appendChild(container);
    }

    // Function to update the score
    incrementScore() {
        this.hitPieces++;
        this.updateScoreDisplay();
    }

    // Update progress bar and text
    updateScoreDisplay() {
        const percentage = (this.hitPieces / this.totalPieces) * 100;
        this.progressFill.style.width = `${percentage}%`;
        this.updateScoreText();
    }

    // Update the score text
    updateScoreText() {
        this.scoreText.textContent = `${this.hitPieces}/${this.totalPieces}`;
    }
}
