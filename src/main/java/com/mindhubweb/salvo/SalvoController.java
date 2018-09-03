package com.mindhubweb.salvo;

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

    @Autowired
    SalvoController(GameRepository gameRepository, GamePlayerRepository gamePlayerRepository, PlayerRepository playerRepository) {
        this.gameRepository = gameRepository;
        this.gamePlayerRepository = gamePlayerRepository;
        this.playerRepository = playerRepository;
    }

    @GetMapping("/game_view/{gamePlayerId}")
    public ResponseEntity<Map<String, Object>> getGameView(@PathVariable Long gamePlayerId, Authentication authentication) {

        GamePlayer gamePlayer = gamePlayerRepository.findById(gamePlayerId).get();

        if ( gamePlayer.getPlayer().getUserName().equals(authentication.getName())) {

            return new ResponseEntity<>(gamePlayer.makeGameViewDTO(), HttpStatus.OK);

        } else {

            return new ResponseEntity<>(makeMap(MyConsts.KEY_ERROR, MyConsts.MSG_ERROR_FORBIDDEN), HttpStatus.FORBIDDEN);
        }
    }

    @GetMapping("/games")
    public Map<String, Object> gameListWithCurrentUserDTO(Authentication authentication) {
        Map<String, Object> dto = new LinkedHashMap<>();
        if (authentication == null || authentication instanceof AnonymousAuthenticationToken) {
            dto.put("current_player", "guest");
        }
        else {
            dto.put("current_player", playerRepository.findByUserName(authentication.getName()).makePlayerDTO());
        }
        dto.put("games", this.getGames());
        return dto;
    }

    public List<Map<String, Object>> getGames() {
        return gameRepository
                .findAll()
                .stream()
                .map(Game::makeGameDTO)
                .collect(Collectors.toList());
    }

    @PostMapping(value="/games")
    public ResponseEntity<Map<String, Object>> createGame(Authentication authentication) {

        if (authentication == null || authentication instanceof AnonymousAuthenticationToken) {

            return new ResponseEntity<>(makeMap(MyConsts.KEY_ERROR, MyConsts.MSG_ERROR_UNAUTHORIZED), HttpStatus.UNAUTHORIZED);

        } else {

            Game game = new Game(LocalDateTime.now());
            gameRepository.save(game);

            GamePlayer gamePlayer = new GamePlayer(game, playerRepository.findByUserName(authentication.getName()), LocalDateTime.now(), new HashSet<>(), new HashSet<>());
            gamePlayerRepository.save(gamePlayer);

            return new ResponseEntity<>(makeMap(MyConsts.KEY_GAME_PLAYER_ID, gamePlayer.getId()), HttpStatus.CREATED);
        }
    }

    @PostMapping(value="/game/{gameId}/players")
    public ResponseEntity<Map<String, Object>> joinGame(@PathVariable Long gameId, Authentication authentication) {

        if (authentication == null || authentication instanceof AnonymousAuthenticationToken) {
            return new ResponseEntity<>(makeMap(MyConsts.KEY_ERROR, MyConsts.MSG_ERROR_UNAUTHORIZED), HttpStatus.UNAUTHORIZED);
        }

        Optional<Game> game = gameRepository.findById(gameId);

        if (!game.isPresent()) {
            return new ResponseEntity<>(makeMap(MyConsts.KEY_ERROR, MyConsts.MSG_ERROR_CONFLICT), HttpStatus.CONFLICT);
        }

        if ( game.get().getGamePlayers().size() > 1 ) {
            return new ResponseEntity<>(makeMap(MyConsts.KEY_ERROR, MyConsts.MSG_ERROR_FORBIDDEN), HttpStatus.FORBIDDEN);
        }

        GamePlayer gamePlayer = new GamePlayer(game.get(), playerRepository.findByUserName(authentication.getName()), LocalDateTime.now(), new HashSet<>(), new HashSet<>());
        gamePlayerRepository.save(gamePlayer);

        return new ResponseEntity<>(makeMap(MyConsts.KEY_GAME_PLAYER_ID, gamePlayer.getId()), HttpStatus.CREATED);

    }

    @PostMapping(value="/players")
    public ResponseEntity<Map<String, Object>> addPlayer(@RequestParam("username") String username, @RequestParam("password") String password, @RequestParam("side") Side side) {

        if (username.isEmpty() || password.isEmpty() || (side != Side.LIGHT && side != Side.DARK)) {

            return new ResponseEntity<>(makeMap(MyConsts.KEY_ERROR, MyConsts.MSG_ERROR_INCOMPLETE_FORM), HttpStatus.BAD_REQUEST);
        }
        else if (playerRepository.findByUserName(username) != null) {

            return new ResponseEntity<>(makeMap(MyConsts.KEY_ERROR, MyConsts.MSG_ERROR_CONFLICT), HttpStatus.CONFLICT);

        } else {

            Player player = new Player(username, password, side);
            playerRepository.save(player);

            return new ResponseEntity<>(makeMap(MyConsts.KEY_USERNAME, username), HttpStatus.CREATED);
        }
    }

    private Map<String, Object> makeMap(String key, Object value) {
        Map<String, Object> map = new HashMap<>();
        map.put(key, value);
        return map;
    }
}
