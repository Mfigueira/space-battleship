package com.mindhubweb.salvo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.stream.Collectors;
import java.util.List;
import java.util.Map;

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
    public Map<String, Object> findGamePlayer(@PathVariable Long gamePlayerId) {
        return gamePlayerRepository
                .findById(gamePlayerId)
                .get().makeGameViewDTO();
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

    @PostMapping(value="/players")
    public ResponseEntity<Map<String, Object>> addPlayer(@RequestParam("username") String username, @RequestParam("password") String password, @RequestParam("side") Side side) {

        if (username.isEmpty() || password.isEmpty() || (side != Side.LIGHT && side != Side.DARK)) {

            return new ResponseEntity<>(makeMap("error", "No Name, Password or Side indicated"), HttpStatus.BAD_REQUEST);
        }
        else if (playerRepository.findByUserName(username) != null) {

            return new ResponseEntity<>(makeMap("error", "Name already in use"), HttpStatus.CONFLICT);

        } else {

            Player player = new Player(username, password, side);
            playerRepository.save(player);

            return new ResponseEntity<>(makeMap("username", username), HttpStatus.CREATED);
        }
    }

    private Map<String, Object> makeMap(String key, Object value) {
        Map<String, Object> map = new HashMap<>();
        map.put(key, value);
        return map;
    }
}
