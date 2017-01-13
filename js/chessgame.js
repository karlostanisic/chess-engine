// HTML unicodes for pieces
var pieces_html_code = new Array();
pieces_html_code['wk'] = '&#9812;';
pieces_html_code['wq'] = '&#9813;';
pieces_html_code['wr'] = '&#9814;';
pieces_html_code['wb'] = '&#9815;';
pieces_html_code['wn'] = '&#9816;';
pieces_html_code['wp'] = '&#9817;';
pieces_html_code['bk'] = '&#9818;';
pieces_html_code['bq'] = '&#9819;';
pieces_html_code['br'] = '&#9820;';
pieces_html_code['bb'] = '&#9821;';
pieces_html_code['bn'] = '&#9822;';
pieces_html_code['bp'] = '&#9823;';


(function() {
    function ChessGame(elem) {
        this.parent = elem;
        this.boardElem = $("<div class='chess-board'></div>");
        $(this.parent).append(this.boardElem);
        this.squareWidth = $(this.boardElem).width() / 8;
        
        this.pieces = new Array(); // Array of pieces as HTML div elemets
        this.animation = false; // If animation of move is finnished
        this.autoplay = false; // Autoplay
        this.gameMoves = new Array(); // Array of game moves
        this.currentMove = 0; // Move counter
        this.board = new Array(); // 2D chess board field
        this.capturedPieces = new Array(); // Array of captured pieces (for going backwards)
        this.promotions = new Array(); // Array of pawn promotions (for going backwards)
        this.enPassant = new Array(); // Array of en passants (for going backwards)
        
        // Creates piece HTML div element on i, j chess board coordinates
        this.createNewPiece = function(i, j, piece) {
            var newPiece = $("<div class='chess-piece'></div>");
            $(newPiece).html(pieces_html_code[piece]); // displaying piece with unicode
            $(newPiece).data("piece", piece); // piece type
            $(newPiece).width(this.squareWidth + "px");
            $(newPiece).height(this.squareWidth + "px");
            $(newPiece).css("font-size", .9 * this.squareWidth + "px");
            // Positioning element on the board
            $(newPiece).css("bottom", i * this.squareWidth);
            $(newPiece).css("left", j * this.squareWidth);
            
            $(this.boardElem).append(newPiece); // Append piece element to chess board element
            this.pieces.push(newPiece); // Add piece to array of pieces
            this.board[i][j] = this.pieces.length - 1; // Define it's position in the board array
            
        };
        
        // Resets game variables
        this.resetGame = function() {
            this.capturedPieces = new Array();
            this.board = new Array();
            this.pieces = new Array();
            $(this.boardElem).empty();
            for (var i = 0; i < 8; i++) {
                this.board[i] = new Array();
                for (var j = 0; j < 8; j++) {
                    this.board[i][j] = -1; // -1 if board square is empty
                }
            }
            
            // Create starting position
            for (var j = 0; j < 8; j++) {
                this.createNewPiece(1,j,"wp");
                this.createNewPiece(6,j,"bp");
            }
            
            this.createNewPiece(0,0,"wr");
            this.createNewPiece(0,1,"wn");
            this.createNewPiece(0,2,"wb");
            this.createNewPiece(0,3,"wq");
            this.createNewPiece(0,4,"wk");
            this.createNewPiece(0,5,"wb");
            this.createNewPiece(0,6,"wn");
            this.createNewPiece(0,7,"wr");

            this.createNewPiece(7,0,"br");
            this.createNewPiece(7,1,"bn");
            this.createNewPiece(7,2,"bb");
            this.createNewPiece(7,3,"bq");
            this.createNewPiece(7,4,"bk");
            this.createNewPiece(7,5,"bb");
            this.createNewPiece(7,6,"bn");
            this.createNewPiece(7,7,"br");
            
            this.animation = false;
            this.currentMove = -1;
            this.autoplay = false;
        };
        
        this.resetGame();
    };
    
    ChessGame.prototype = {
        // Checks if move is casttling
        isCasttle: function(pos1, pos2) {
            var piece = this.pieces[this.board[pos1[1]][pos1[0]]];
            if (($(piece).data('piece') === "wk" || $(piece).data('piece') === "bk")) {
                var distance = Math.abs(pos1[0] - pos2[0]);
                if (distance === 2) return true; // If king moves two squares than it's casttle
            }
            return false;
        },
        
        // Animates piece element from starting to finishing position
        animateMove: function(pos1, pos2, casstle) {
            casstle = casstle || false;
            var piece = this.pieces[this.board[pos1[1]][pos1[0]]];
            $(piece).css("transition", "1s");
            $(piece).css("bottom", (pos2[1] * this.squareWidth) + "px");
            $(piece).css("left", (pos2[0] * this.squareWidth) + "px");
            var that = this;
            if (!casstle) {
                $(piece).one('transitionend',   
                    function(e) {
                        that.afterAnimation();
                });
            }
        },
        
        // Checkes if move is en passant
        checkEnPassant: function() {
            var startPos = this.gameMoves[this.currentMove][0];
            var endPos = this.gameMoves[this.currentMove][1];
            var piece = this.pieces[this.board[startPos[1]][startPos[0]]];
            if ($(piece).data("piece").slice(-1) === "p" 
                    && startPos[0] !== endPos[0] 
                    && !this.pieces[this.board[endPos[1]][endPos[0]]]) {
                // Remember captured piece for moving backwards
                this.enPassant[this.currentMove] = this.board[startPos[1]][endPos[0]];
                $(this.pieces[this.board[startPos[1]][endPos[0]]]).delay(1000).hide(0);
                return true;
            } else {
                this.enPassant[this.currentMove] = -1;
                return false;
            }
        },
        
        // Checkes if move is en passant when moving backwards
        checkEnPassantBack: function() {
            var startPos = this.gameMoves[this.currentMove][1];
            var endPos = this.gameMoves[this.currentMove][0];
            if (this.enPassant[this.currentMove] !== -1) {
                // Return captured piece on the board
                this.board[endPos[1]][startPos[0]] = this.enPassant[this.currentMove];
                $(this.pieces[this.enPassant[this.currentMove]]).delay(1000).show(0);
                return true;
            }
            return false;
        },
        
        // Checkes if move is capturing
        checkCapturing: function() {
            var pos2 = this.gameMoves[this.currentMove][1];
            if (this.board[pos2[1]][pos2[0]] !== -1) {
                // Remember captured piece for moving backwards
                $(this.pieces[this.board[pos2[1]][pos2[0]]]).delay(1000).hide(0);
                this.capturedPieces[this.currentMove] = this.board[pos2[1]][pos2[0]];
                return true;
            } else {
                this.capturedPieces[this.currentMove] = -1;
                return false;
            }
        },
        
        // Checkes if move is pawn promotion
        checkPromotion: function() {
            var startPos = this.gameMoves[this.currentMove][0];
            var endPos = this.gameMoves[this.currentMove][1];
            var piece = this.pieces[this.board[startPos[1]][startPos[0]]];
            if ($(piece).data("piece").slice(-1) === "p" && (endPos[1] === 0 || endPos[1] === 7)) {
                // Remember there was a promotion in this move
                this.promotions[this.currentMove] = true;
                var promotedTo = (this.currentMove % 2 === 0) ? "w" + this.gameMoves[this.currentMove][2] : "b" + this.gameMoves[this.currentMove][2];
                setTimeout(function() {
                    // Change pawn into promotion choice
                    $(piece).html(pieces_html_code[promotedTo]);
                }, 1000);
                $(piece).data("piece", promotedTo);
                return true;
            } else {
                this.promotions[this.currentMove] = false;
                return false;
            }
        },
        
        // Checkes if move is pawn promotion when moving backwards
        checkPromotionBack: function() {
            var startPos = this.gameMoves[this.currentMove][1];
            var piece = this.pieces[this.board[startPos[1]][startPos[0]]];
            if (this.promotions[this.currentMove]) {
                var promotedFrom = (this.currentMove % 2 === 0) ? "wp" : "bp";
                $(piece).html(pieces_html_code[promotedFrom]);
                $(piece).data("piece", promotedFrom);
                return true;
            }
            return false;
        },
        
        // Checkes if move is capturing when going backwards
        checkDeCapturing: function() {
            if (this.capturedPieces[this.currentMove] !== -1) {
                $(this.pieces[this.capturedPieces[this.currentMove]]).show();
                return true;
            }
            return false;
        },
        
        // Finds current position of piece with given index in pieces array
        findPiece: function(index) {
            for (var i = 0; i < 8; i++) {
                for (var j = 0; j < 8; j++) {
                    if (this.board[i][j] === index) {
                        return [i,j];
                    }
                }
            }
            return false;
        },
        
        // Update board field after move
        updateBoard: function(pos1, pos2) {
                this.board[pos2[1]][pos2[0]] = this.board[pos1[1]][pos1[0]];
                this.board[pos1[1]][pos1[0]] = -1;
        },
        
        // Next move, forward or backwards
        move: function(forward) {
            forward = (forward !== false);
            // If animation is still going exit function
            if (this.animation || (!forward && this.autoplay)) return false;
            this.animation = true;
            
            if (forward) {
                // Check if it's last move when moving forward
                if (this.currentMove === (this.gameMoves.length - 1)) {
                    this.autoplay = false;
                    this.animation = false;
                    return false;
                } else {
                    this.currentMove++;
                }
            } else {
                // Checki if it's first move when going backward
                if (this.currentMove < 0) {
                    this.animation = false;
                    return false;
                }
            }
            
            var pos1 = this.gameMoves[this.currentMove][0];
            var pos2 = this.gameMoves[this.currentMove][1];
            
            // If casttling, we need to move the rook too
            if ((forward && this.isCasttle(pos1, pos2)) || (!forward && this.isCasttle(pos2, pos1))) {
                if (pos2[0] === 2) {
                    var rookMove = [[0,pos2[1]], [3,pos2[1]]];
                } else {
                    var rookMove = [[7,pos2[1]], [5,pos2[1]]];
                }
                if (!forward) {
                    rookMove = [rookMove[1], rookMove[0]];
                    
                }
                this.animateMove(rookMove[0], rookMove[1], true);
                this.updateBoard(rookMove[0], rookMove[1]);                
            } 
            
            // If backward switch start and end squares
            if (!forward) {
                var pos1 = this.gameMoves[this.currentMove][1];
                var pos2 = this.gameMoves[this.currentMove][0];
            }
            
            this.animateMove(pos1, pos2);
            
            // Checking for en passant, promotion and capturing
            if (forward) {
                this.checkEnPassant();
                this.checkPromotion();
                this.checkCapturing();
                this.updateBoard(pos1, pos2);
            } else {
                this.checkEnPassantBack();
                this.checkPromotionBack();
                this.updateBoard(pos1, pos2);
                if (this.checkDeCapturing()) {
                    this.board[pos1[1]][pos1[0]] = this.capturedPieces[this.currentMove];
                }
                this.currentMove--;
            }
        },
        
        // When animation is done..
        afterAnimation: function() {
            this.animation = false;
            if (this.autoplay) {
                this.move();
            }
        },
        
        setAutoplay: function(autoplay) {
            this.autoplay = autoplay;
            if (this.autoplay) this.move();
        },
        
        newGame: function(gameMoves) {
            this.resetGame();
            this.gameMoves = gameMoves;
        }
    };

    window.ChessGame = ChessGame;
})();


