# chess-engine
Not for playing, just for replaying game given moves

Code is written in jQuery and animation is done by CSS transitions. 
Pieces are HTML elements on which, depending on move played in the game, you apply CSS transform property with appropriate coordinates. 
Going one way was pretty straightforward, but when I decided to implement backward play, things got a little bit more complicated 
because you need to remember all captured pieces, watch for en passants and pawn promotions, but still easy enough. 
Unfortunately, I didn’t implement PGN format for game moves, it would take a lot more time. But, in near future, 
I can see that happening – it would be nice to download couple of games and watch them on my little engine that could.

Check out demo on www.karlostanisic.com
