package com.mindhubweb.salvo.Controller;

import com.mindhubweb.salvo.Model.AppMessages;
import com.mindhubweb.salvo.Model.*;
import com.mindhubweb.salvo.Repositories.GamePlayerRepository;
import com.mindhubweb.salvo.Repositories.GameRepository;
import com.mindhubweb.salvo.Repositories.PlayerRepository;
import com.mindhubweb.salvo.Repositories.ScoreRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class SalvoController {

    private GameRepository gameRepository;
    private GamePlayerRepository gamePlayerRepository;
    private PlayerRepository playerRepository;
    private ScoreRepository scoreRepository;

    @Autowired
    SalvoController(GameRepository gameRepository, GamePlayerRepository gamePlayerRepository, PlayerRepository playerRepository, ScoreRepository scoreRepository) {
        this.gameRepository = gameRepository;
        this.gamePlayerRepository = gamePlayerRepository;
        this.playerRepository = playerRepository;
        this.scoreRepository = scoreRepository;
    }

    @GetMapping("/game_view/{gamePlayerId}")
    public ResponseEntity<Map<String, Object>> getGameView(@PathVariable Long gamePlayerId, Authentication authentication) {
        Optional <GamePlayer> gamePlayer = gamePlayerRepository.findById(gamePlayerId);
        if ( gamePlayer.isPresent() && gamePlayer.get().getPlayer().getUserName().equals(authentication.getName())) {
            return new ResponseEntity<>(gamePlayer.get().makeGameViewDTO(), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(makeMap(AppMessages.KEY_ERROR, AppMessages.MSG_ERROR_FORBIDDEN), HttpStatus.FORBIDDEN);
        }
    }

    @GetMapping("/games")
    public ResponseEntity<Map<String, Object>> gameListWithCurrentUserDTO(Authentication authentication) {
        Map<String, Object> dto = new LinkedHashMap<>();
        if ( isGuest(authentication) ) {
            dto.put("current_player", "guest");
        }
        else {
            dto.put("current_player", playerRepository.findByUserName(authentication.getName()).makePlayerDTO());
        }
        dto.put("games", this.getGames());
        return new ResponseEntity<>(dto, HttpStatus.OK);
    }

    public List<Map<String, Object>> getGames() {
        return gameRepository
                .findAll()
                .stream()
                .map(Game::makeGameDTO)
                .collect(Collectors.toList());
    }

    @PostMapping(value="/games/players/{gamePlayerId}/ships")
    public ResponseEntity<Map<String, Object>> placeShips(@PathVariable Long gamePlayerId, Authentication authentication, @RequestBody Set<Ship> ships) {

        Optional <GamePlayer> gamePlayer = gamePlayerRepository.findById(gamePlayerId);
        int totalShips = 5;

        if ( isGuest(authentication) || (!gamePlayer.isPresent()) || (!gamePlayer.get().getPlayer().getUserName().equals(authentication.getName()))) {
            return new ResponseEntity<>(makeMap(AppMessages.KEY_ERROR, AppMessages.MSG_ERROR_UNAUTHORIZED), HttpStatus.UNAUTHORIZED);
        }
        if ( gamePlayer.get().getShips().size() > 0 || ships.size() != totalShips ) {
            return new ResponseEntity<>(makeMap(AppMessages.KEY_ERROR, AppMessages.MSG_ERROR_FORBIDDEN), HttpStatus.FORBIDDEN);
        }
        if ( gamePlayer.get().getGame().getGamePlayers().size() < 2 ) {
            return new ResponseEntity<>(makeMap(AppMessages.KEY_ERROR, AppMessages.MSG_ERROR_FORBIDDEN), HttpStatus.FORBIDDEN);
        }

        gamePlayer.get().addShips(ships);
        gamePlayerRepository.save(gamePlayer.get());

        return new ResponseEntity<>(makeMap(AppMessages.KEY_CREATED, AppMessages.MSG_CREATED), HttpStatus.CREATED);

    }

    @PostMapping(value="/games/players/{gamePlayerId}/salvos")
    public ResponseEntity<Map<String, Object>> fireSalvos(@PathVariable Long gamePlayerId, Authentication authentication, @RequestBody Salvo salvo) {

        Optional <GamePlayer> gamePlayer = gamePlayerRepository.findById(gamePlayerId);
        if ( isGuest(authentication) || (!gamePlayer.isPresent()) || (!gamePlayer.get().getPlayer().getUserName().equals(authentication.getName()))) {
            return new ResponseEntity<>(makeMap(AppMessages.KEY_ERROR, AppMessages.MSG_ERROR_UNAUTHORIZED), HttpStatus.UNAUTHORIZED);
        }

        Optional <GamePlayer> opponentGamePlayer = gamePlayer.get().getGame().getGamePlayers().stream().filter(gamePlayer1 -> gamePlayer1.getId() != gamePlayerId).findFirst();
        if ( !opponentGamePlayer.isPresent() || opponentGamePlayer.get().getShips().size() == 0 || opponentGamePlayer.get().getSalvoes().size() < salvo.getTurn()-1) {
            return new ResponseEntity<>(makeMap(AppMessages.KEY_ERROR, AppMessages.MSG_ERROR_FORBIDDEN), HttpStatus.FORBIDDEN);
        }

        Optional <Salvo> salvoRepeated = gamePlayer.get().getSalvoes().stream().filter(salvo1 -> salvo1.getTurn() == salvo.getTurn()).findAny();
        if ( salvoRepeated.isPresent() ) {
            return new ResponseEntity<>(makeMap(AppMessages.KEY_ERROR, AppMessages.MSG_ERROR_FORBIDDEN), HttpStatus.FORBIDDEN);
        }

        int lastTurn = gamePlayer.get().getSalvoes().stream().mapToInt(Salvo::getTurn).max().orElse(0);
        if (salvo.getTurn() != lastTurn + 1) {
            return new ResponseEntity<>(makeMap(AppMessages.KEY_ERROR, AppMessages.MSG_ERROR_FORBIDDEN), HttpStatus.FORBIDDEN);
        }

        if ( (gamePlayerId > opponentGamePlayer.get().getId()) && (gamePlayer.get().getSalvoes().size() == opponentGamePlayer.get().getSalvoes().size())) {
            return new ResponseEntity<>(makeMap(AppMessages.KEY_ERROR, AppMessages.MSG_ERROR_FORBIDDEN), HttpStatus.FORBIDDEN);
        }

        if ( gamePlayer.get().shotsToMake() != salvo.getShots().size() ) {
            return new ResponseEntity<>(makeMap(AppMessages.KEY_ERROR, AppMessages.MSG_ERROR_FORBIDDEN), HttpStatus.FORBIDDEN);
        }

        if ( (gamePlayer.get().gameState()==GamePlayerState.WIN) || (gamePlayer.get().gameState() == GamePlayerState.LOSE) || (gamePlayer.get().gameState() == GamePlayerState.DRAW) || (gamePlayer.get().gameState() == GamePlayerState.EPIC_WIN)) {
            return new ResponseEntity<>(makeMap(AppMessages.KEY_ERROR, AppMessages.MSG_ERROR_FORBIDDEN), HttpStatus.FORBIDDEN);
        }

        gamePlayer.get().addSalvo(salvo);
        GamePlayer gamePlayerSaved = gamePlayerRepository.save(gamePlayer.get());

        if ( gamePlayerSaved != null ) {
            if (gamePlayer.get().gameState() == GamePlayerState.WIN || (gamePlayer.get().gameState() == GamePlayerState.EPIC_WIN)) {
                scoreRepository.save(new Score(gamePlayer.get().getGame(), gamePlayer.get().getPlayer(), 3, LocalDateTime.now()));
                scoreRepository.save(new Score(gamePlayer.get().getGame(), opponentGamePlayer.get().getPlayer(), 0, LocalDateTime.now()));
            } else if (gamePlayer.get().gameState() == GamePlayerState.LOSE) {
                scoreRepository.save(new Score(gamePlayer.get().getGame(), gamePlayer.get().getPlayer(), 0, LocalDateTime.now()));
                scoreRepository.save(new Score(gamePlayer.get().getGame(), opponentGamePlayer.get().getPlayer(), 3, LocalDateTime.now()));
            } else if (gamePlayer.get().gameState() == GamePlayerState.DRAW) {
                scoreRepository.save(new Score(gamePlayer.get().getGame(), gamePlayer.get().getPlayer(), 1, LocalDateTime.now()));
                scoreRepository.save(new Score(gamePlayer.get().getGame(), opponentGamePlayer.get().getPlayer(), 1, LocalDateTime.now()));
            }
        }

        return new ResponseEntity<>(makeMap(AppMessages.KEY_CREATED, AppMessages.MSG_CREATED), HttpStatus.CREATED);
    }

    @PostMapping(value="/games")
    public ResponseEntity<Map<String, Object>> createGame(Authentication authentication) {
        if ( isGuest(authentication) ) {
            return new ResponseEntity<>(makeMap(AppMessages.KEY_ERROR, AppMessages.MSG_ERROR_UNAUTHORIZED), HttpStatus.UNAUTHORIZED);
        } else {
            Game game = new Game(LocalDateTime.now());
            gameRepository.save(game);
            GamePlayer gamePlayer = new GamePlayer(game, playerRepository.findByUserName(authentication.getName()), LocalDateTime.now(), new HashSet<>(), new HashSet<>());
            gamePlayerRepository.save(gamePlayer);
            return new ResponseEntity<>(makeMap(AppMessages.KEY_GAME_PLAYER_ID, gamePlayer.getId()), HttpStatus.CREATED);
        }
    }

    @PostMapping(value="/game/{gameId}/players")
    public ResponseEntity<Map<String, Object>> joinGame(@PathVariable Long gameId, Authentication authentication) {
        if ( isGuest(authentication) ) {
            return new ResponseEntity<>(makeMap(AppMessages.KEY_ERROR, AppMessages.MSG_ERROR_UNAUTHORIZED), HttpStatus.UNAUTHORIZED);
        }
        Optional<Game> game = gameRepository.findById(gameId);
        if (!game.isPresent()) {
            return new ResponseEntity<>(makeMap(AppMessages.KEY_ERROR, AppMessages.MSG_ERROR_CONFLICT), HttpStatus.CONFLICT);
        }
        if ( game.get().getGamePlayers().size() > 1 ) {
            return new ResponseEntity<>(makeMap(AppMessages.KEY_ERROR, AppMessages.MSG_ERROR_FORBIDDEN), HttpStatus.FORBIDDEN);
        }
        GamePlayer gamePlayer = new GamePlayer(game.get(), playerRepository.findByUserName(authentication.getName()), LocalDateTime.now(), new HashSet<>(), new HashSet<>());
        gamePlayerRepository.save(gamePlayer);
        return new ResponseEntity<>(makeMap(AppMessages.KEY_GAME_PLAYER_ID, gamePlayer.getId()), HttpStatus.CREATED);
    }

    @PostMapping(value="/players")
    public ResponseEntity<Map<String, Object>> addPlayer(@RequestParam("username") String username, @RequestParam("email") String email, @RequestParam("password") String password, @RequestParam("side") Side side) {
        if (username.isEmpty() || email.isEmpty() || password.isEmpty() || (side != Side.LIGHT && side != Side.DARK)) {
            return new ResponseEntity<>(makeMap(AppMessages.KEY_ERROR, AppMessages.MSG_ERROR_INCOMPLETE_FORM), HttpStatus.BAD_REQUEST);
        }
        else if ((playerRepository.findByUserName(username) != null) || (playerRepository.findByUserName(email) != null)) {
            return new ResponseEntity<>(makeMap(AppMessages.KEY_ERROR, AppMessages.MSG_ERROR_CONFLICT), HttpStatus.CONFLICT);
        } else {
            Player player = new Player(username, email, password, side);
            playerRepository.save(player);
            return new ResponseEntity<>(makeMap(AppMessages.KEY_USERNAME, username), HttpStatus.CREATED);
        }
    }

    private Map<String, Object> makeMap(String key, Object value) {
        Map<String, Object> map = new HashMap<>();
        map.put(key, value);
        return map;
    }

    private boolean isGuest(Authentication authentication) {
        return authentication == null || authentication instanceof AnonymousAuthenticationToken;
    }
}
