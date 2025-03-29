// src/App.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Input,
  Button,
  VStack,
  HStack,
  NumberInput,
  Checkbox,
  Flex,
  IconButton,
} from '@chakra-ui/react';
import { ColorModeButton, useColorModeValue } from './components/ui/color-mode';
import { Tooltip } from './components/ui/tooltip'; // Assuming you have a Tooltip component
import { Toaster, toaster } from './components/ui/toaster';
import { Problem, GameSettings, Operation, GameStatus } from './types';
import { generateProblem } from './utils/gameUtils';
import { LuPencilLine } from "react-icons/lu";

const INITIAL_LIVES = 5;
const GAME_AREA_HEIGHT = 600;
const PROBLEM_GENERATION_INTERVAL_MS = 2500;

function App() {
  // --- State & Refs (as before) ---
  const [playerName, setPlayerName] = useState<string>(() => localStorage.getItem('mathBlasterPlayerName') || '');
  const [inputName, setInputName] = useState<string>(playerName);
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(INITIAL_LIVES);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentInput, setCurrentInput] = useState<string>('');
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [settings, setSettings] = useState<GameSettings>({ digits: 1, operations: ['+'], initialSpeed: 0.7, speedIncrement: 0.03 });
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const problemIdCounter = useRef<number>(0);
  const problemIntervalRef = useRef<number | null>(null);
  const currentSpeed = useRef<number>(settings.initialSpeed);

  // --- Color Mode Values (as before) ---
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.800', 'white');
  const headingColor = useColorModeValue('teal.600', 'teal.300');
  const gameAreaBg = useColorModeValue('linear(to-b, blue.100, blue.200)', 'linear(to-b, gray.800, blue.900)');
  const gameAreaBorder = useColorModeValue('teal.400', 'teal.600');
  const problemBg = useColorModeValue('blue.500', 'rgba(9, 27, 61, 0.8)');
  const problemColor = useColorModeValue('white', 'yellow.300');
  const problemBorderColor = useColorModeValue('blue.300', 'blue.400');
  const inputBg = useColorModeValue('white', 'gray.700');
  const inputBorder = useColorModeValue('gray.300', 'teal.300');
  const inputFocusBorder = useColorModeValue('teal.500', 'teal.100');
  const settingsBoxBg = useColorModeValue('gray.100', 'gray.800');
  const settingsBorder = useColorModeValue('gray.300', 'gray.600');
  const livesOkColor = useColorModeValue('green.600', 'green.300');
  const livesLowColor = useColorModeValue('red.600', 'red.400');
  const nameInputBorder = useColorModeValue('gray.400', 'teal.400');
  const gameOverScoreColor = useColorModeValue("red.600", "yellow.400");

  // --- Callbacks & Effects ---
  const gameLoop = useCallback(() => {
    let lifeLostThisFrame = false;
    setProblems((prevProblems) => {
      const nextProblems = prevProblems
        .map((p) => ({ ...p, y: p.y + currentSpeed.current }))
        .filter((p) => {
          if (p.y < GAME_AREA_HEIGHT) return true;
          lifeLostThisFrame = true;
          return false;
        });
      if (lifeLostThisFrame) {
         // console.log('[GameLoop] Life lost detected. Decrementing.'); // Log for life loss
         setLives((prevLives) => {
            // console.log(`[StrictMode Debug] setLives called. Prev: ${prevLives}, Next: ${Math.max(0, prevLives - 1)}`); // Log for StrictMode insight
            return Math.max(0, prevLives - 1);
         });
      }
      return nextProblems;
    });
    if (gameStatus === 'playing') {
       requestRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameStatus]); // Keep dependency minimal

  const startProblemGeneration = useCallback(() => { /* ...as before... */
    if (problemIntervalRef.current) clearInterval(problemIntervalRef.current);
    problemIntervalRef.current = setInterval(() => {
      let newProblem: Problem | null = null;
      let attempts = 0;
      while (newProblem === null && attempts < 5) {
        newProblem = generateProblem(settings, problemIdCounter.current++);
        attempts++;
      }
      if (newProblem) setProblems((prev) => [...prev, newProblem!]);
      else console.error('Failed to generate problem.');
    }, PROBLEM_GENERATION_INTERVAL_MS);
  }, [settings]);

  useEffect(() => { // Game Over check
    if (gameStatus === 'playing' && lives <= 0) {
      setGameStatus('gameOver');
      setTimeout(() => {
           toaster.create({ title: 'Game Over!', description: `Final Score: ${score}`, type: 'error', duration: 5000 });
      }, 50);
    }
  }, [lives, gameStatus, score]);

  useEffect(() => { // Start/Stop Loop
     if (gameStatus === 'playing') {
         if (!requestRef.current) {
             // console.log(`Starting game loop effect. Initial speed: ${settings.initialSpeed}`); // Log initial speed on start
             currentSpeed.current = settings.initialSpeed; // Ensure speed is reset here
             requestRef.current = requestAnimationFrame(gameLoop);
             startProblemGeneration();
             inputRef.current?.focus();
         }
     } else { // Cleanup when not playing
         if (requestRef.current) { cancelAnimationFrame(requestRef.current); requestRef.current = undefined; }
         if (problemIntervalRef.current) { clearInterval(problemIntervalRef.current); problemIntervalRef.current = null; }
     }
     return () => { // Cleanup on unmount/dep change
       if (requestRef.current) cancelAnimationFrame(requestRef.current);
       if (problemIntervalRef.current) clearInterval(problemIntervalRef.current);
       requestRef.current = undefined;
       problemIntervalRef.current = null;
     };
  }, [gameStatus, settings.initialSpeed, gameLoop, startProblemGeneration]);

  useEffect(() => { /* Local Storage */ localStorage.setItem('mathBlasterPlayerName', playerName); }, [playerName]);

  // --- Event Handlers ---
  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => { setInputName(event.target.value); };
  const handleSetPlayerName = () => { /* ... as before ... */
     const trimmedName = inputName.trim();
     if (trimmedName) { setPlayerName(trimmedName); toaster.create({ title: `Name set: ${trimmedName}`, type: 'success', duration: 1500 }); }
     else { toaster.create({ title: 'Please enter a name', type: 'warning', duration: 2000 }); }
  };
  const handleEditName = () => { setInputName(playerName); setPlayerName(''); };
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => { setCurrentInput(event.target.value); };

  // *** REVISED Submit Handler ***
  const handleSubmitAnswer = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (gameStatus !== 'playing' || !currentInput.trim()) return;
    const answerValue = parseInt(currentInput.trim(), 10);
    if (isNaN(answerValue)) { toaster.create({ title: 'Please enter a number', type: 'warning', duration: 1500 }); return; }

    let matchFoundInSubmission = false; // Use a distinct name

    setProblems((prevProblems) => {
       // console.log('[setProblems] Filtering start. Input:', answerValue, 'Current problems:', prevProblems.map(p => ({id: p.id, ans: p.answer}))); // Log before filter
       let removedProblemId: number | null = null;
       const remainingProblems = prevProblems.filter((p) => {
        // Log comparison inside filter
        // console.log(`[Filter] Comparing problem ${p.id} (ans: ${p.answer}, type: ${typeof p.answer}) with input (val: ${answerValue}, type: ${typeof answerValue})`);
        if (removedProblemId === null && p.answer === answerValue) { // Only remove the first match
          // console.log(`[Filter] Match FOUND for problem ${p.id}. Returning false (removing).`); // Log match
          removedProblemId = p.id; // Mark which one was removed
          matchFoundInSubmission = true; // Set the outer flag
          return false; // Remove item
        }
        return true; // Keep item
      });

      // Perform actions *only if* a match was found *within this specific update*
      if (matchFoundInSubmission) {
          // console.log('[setProblems] Match confirmed. Updating score, speed, clearing input.');
          setScore(prevScore => {
             // console.log(`[StrictMode Debug] setScore called. Prev: ${prevScore}, Next: ${prevScore + 1}`);
             return prevScore + 1;
          });
          currentSpeed.current += settings.speedIncrement;
          toaster.create({ title: 'Correct!', type: 'success', duration: 1000 });
          setCurrentInput(''); // Clear input here
      }
       // console.log('[setProblems] Filtering end. Match found:', matchFoundInSubmission, 'Remaining problems:', remainingProblems.map(p => p.id)); // Log after filter
       return remainingProblems; // Return the correctly filtered array
    });

    // Incorrect toast logic (runs only if no match was found in the update cycle)
     if (!matchFoundInSubmission) {
       // console.log('Incorrect answer registered.');
       toaster.create({ title: 'Try again!', type: 'warning', duration: 1000 });
       // Optional: Reset input even on wrong answer
       // setCurrentInput('');
     }
  };

  // ... (startGame, resetGame, handleDigitsChange, handleSingleOperationChange remain the same) ...
   const startGame = () => { /* ... as before, ensures speed reset */
    if (!playerName) { toaster.create({ title: 'Please set player name first!', type: 'warning', duration: 3000 }); return; }
    if (settings.operations.length === 0) { toaster.create({ title: 'Please select at least one operation!', type: 'warning', duration: 3000 }); return; }
    setScore(0); setLives(INITIAL_LIVES); setProblems([]); setCurrentInput('');
    problemIdCounter.current = 0;
    // console.log(`[startGame] Resetting speed to: ${settings.initialSpeed}`); // Confirm speed reset
    currentSpeed.current = settings.initialSpeed; // Speed reset confirmation
    setGameStatus('playing');
    toaster.create({ title: 'Game started!', description: `Good luck, ${playerName}!`, type: 'info', duration: 2000 });
  };
  const resetGame = () => { setGameStatus('idle'); };
  const handleDigitsChange = (valueAsString: string, valueAsNumber: number) => { /* ... as before ... */
    const newDigits = isNaN(valueAsNumber) ? 1 : Math.max(1, valueAsNumber);
    setSettings(prev => ({ ...prev, digits: newDigits }));
   };
  const handleSingleOperationChange = (operation: Operation, isChecked: boolean) => { /* ... as before ... */
      setSettings(prevSettings => {
          const currentOps = prevSettings.operations;
          const newOpsSet = new Set(currentOps);
          if (isChecked) { newOpsSet.add(operation); } else { newOpsSet.delete(operation); }
          return { ...prevSettings, operations: Array.from(newOpsSet) };
      });
   };

  // --- Rendering (Minor adjustments needed in Player Name area) ---
  return (
    <Container
      centerContent
      maxW="container.md"
      p={4}
      minH="100vh"
      bg={bgColor}
      color={textColor}
      position="relative"
    >
      <Toaster />
      <Box position="absolute" top={4} right={4} zIndex={10}>
        {' '}
        <ColorModeButton />{' '}
      </Box>

      <VStack gap={6} align="stretch" w="100%">
        <Heading textAlign="center" color={headingColor} size="2xl">
          {' '}
          Math Blaster!{' '}
        </Heading>

        {/* Player Name Area - Updated */}
        {gameStatus === 'idle' && (
          <VStack>
            {playerName ? (
              <HStack>
                <Text fontSize="xl">Player: {playerName}</Text>
                <Tooltip content="Edit Name" positioning={{ placement: 'top' }}>
                  <IconButton
                    aria-label="Edit player name"
                    size="sm"
                    variant="ghost"
                    onClick={handleEditName}
                  >
                    <LuPencilLine />
                </IconButton>
                </Tooltip>

              </HStack>
            ) : (
              <HStack w="100%" maxW="400px">
                <Input
                  placeholder="Enter your name"
                  value={inputName}
                  onChange={handleNameChange}
                  borderColor={nameInputBorder}
                  size="md"
                  bg={inputBg}
                  autoFocus
                />
                <Button
                  onClick={handleSetPlayerName}
                  colorPalette="teal"
                  size="md"
                >
                  Set Name
                </Button>
              </HStack>
            )}
          </VStack>
        )}

        {/* Settings Area */}
        {/* ... (Settings JSX remains the same) ... */}
        {gameStatus === 'idle' && (
          <Box
            p={5}
            borderWidth={1}
            borderRadius="lg"
            borderColor={settingsBorder}
            bg={settingsBoxBg}
          >
            <Heading size="lg" mb={5} textAlign="center">
              {' '}
              Settings{' '}
            </Heading>
            <Flex
              direction={{ base: 'column', md: 'row' }}
              gap={{ base: 4, md: 8 }}
              justify="center"
              align={{ base: 'center', md: 'flex-start' }}
            >
              <HStack
                minW="200px"
                justify={{ base: 'center', md: 'flex-start' }}
              >
                <Text minW="60px" fontWeight="medium">
                  Digits:
                </Text>
                <NumberInput.Root
                  size="md"
                  maxW="100px"
                  value={settings.digits.toString()}
                  onValueChange={(details) => {
                    handleDigitsChange(details.value, details.valueAsNumber);
                  }}
                  min={1}
                  max={3}
                  allowMouseWheel
                >
                  <NumberInput.Input bg={inputBg} textAlign="center" />
                  <NumberInput.Control>
                    {' '}
                    <NumberInput.DecrementTrigger />{' '}
                    <NumberInput.IncrementTrigger />{' '}
                  </NumberInput.Control>
                </NumberInput.Root>
              </HStack>
              <HStack
                align="start"
                minW="200px"
                justify={{ base: 'center', md: 'flex-start' }}
              >
                <Text minW="60px" mt={1} fontWeight="medium">
                  {' '}
                  Operations:{' '}
                </Text>
                <VStack gap={2} align="start">
                  {(['+', '-', '*', '/'] as const).map((op) => {
                    const opLabels = {
                      '+': 'Addition (+)',
                      '-': 'Sub (-)',
                      '*': 'Mul (x)',
                      '/': 'Div (÷)',
                    };
                    return (
                      <Checkbox.Root
                        key={op}
                        size="lg"
                        colorPalette="green"
                        checked={settings.operations.includes(op)}
                        onCheckedChange={(details) => {
                          handleSingleOperationChange(op, !!details.checked);
                        }}
                      >
                        <Checkbox.HiddenInput /> <Checkbox.Control />{' '}
                        <Checkbox.Label>{opLabels[op]}</Checkbox.Label>
                      </Checkbox.Root>
                    );
                  })}
                </VStack>
              </HStack>
            </Flex>
          </Box>
        )}

        {/* Game Area */}
        {/* ... (Game Area JSX remains the same) ... */}
        {gameStatus !== 'idle' && (
          <Box
            ref={gameAreaRef}
            w="100%"
            h={`${GAME_AREA_HEIGHT}px`}
            bgGradient={gameAreaBg}
            position="relative"
            overflow="hidden"
            border="2px solid"
            borderColor={gameAreaBorder}
            borderRadius="md"
            boxShadow="lg"
          >
            {problems.map((problem) => (
              <Text
                key={problem.id}
                position="absolute"
                left={`${problem.x}%`}
                top={`${problem.y}px`}
                transform="translateX(-50%)"
                bg={problemBg}
                color={problemColor}
                py={1}
                px={3}
                borderRadius="full"
                fontWeight="bold"
                fontSize="lg"
                whiteSpace="nowrap"
                userSelect="none"
                border="1px solid"
                borderColor={problemBorderColor}
              >
                {problem.text}
              </Text>
            ))}
          </Box>
        )}

        {/* Scoreboard & Input Area */}
        {/* ... (Scoreboard & Input Area JSX remains the same) ... */}
        {(gameStatus === 'playing' || gameStatus === 'gameOver') && (
          <Flex
            justify="space-between"
            align="center"
            w="100%"
            wrap="wrap"
            gap={4}
          >
            <HStack gap={5}>
              <Text fontSize="lg" fontWeight="medium">
                Score: {score}
              </Text>
              <Text
                fontSize="lg"
                fontWeight="medium"
                color={lives <= 1 ? livesLowColor : livesOkColor}
              >
                Lives: {'❤️'.repeat(lives)}{' '}
                {'🖤'.repeat(Math.max(0, INITIAL_LIVES - lives))}
              </Text>
            </HStack>
            {gameStatus === 'playing' && (
              <form
                onSubmit={handleSubmitAnswer}
                style={{ flexGrow: 1, marginLeft: '20px', minWidth: '150px' }}
              >
                <HStack>
                  <Input
                    ref={inputRef}
                    placeholder="Type answer + Enter..."
                    value={currentInput}
                    onChange={handleInputChange}
                    type="number"
                    pattern="\d*"
                    bg={inputBg}
                    borderColor={inputBorder}
                    _focus={{
                      borderColor: inputFocusBorder,
                      boxShadow: `0 0 0 1px ${inputFocusBorder}`,
                    }}
                    size="md"
                    autoComplete="off"
                    disabled={gameStatus !== 'playing'}
                  />
                  <Button
                    type="submit"
                    size="md"
                    colorPalette="teal"
                    disabled={gameStatus !== 'playing'}
                  >
                    {' '}
                    Submit{' '}
                  </Button>
                </HStack>
              </form>
            )}
            {gameStatus === 'gameOver' && (
              <Text fontSize="xl" fontWeight="bold" color={gameOverScoreColor}>
                Final Score: {score}
              </Text>
            )}
          </Flex>
        )}

        {/* Control Buttons */}
        {/* ... (Control Buttons JSX remains the same) ... */}
        <HStack justify="center" w="100%" gap={5}>
          {gameStatus === 'idle' && (
            <Button
              colorPalette="green"
              variant="solid"
              size="lg"
              onClick={startGame}
              disabled={!playerName || settings.operations.length === 0}
              boxShadow="md"
            >
              {' '}
              Start Game{' '}
            </Button>
          )}
          {gameStatus === 'playing' && (
            <Button
              colorPalette="red"
              size="lg"
              variant="outline"
              onClick={() => {
                setGameStatus('gameOver');
                toaster.create({
                  title: 'Game Ended',
                  description: `Final Score: ${score}`,
                  type: 'info',
                  duration: 3000,
                });
              }}
            >
              {' '}
              End Game{' '}
            </Button>
          )}
          {gameStatus === 'gameOver' && (
            <Button
              colorPalette="blue"
              size="lg"
              onClick={resetGame}
              boxShadow="md"
            >
              {' '}
              Play Again / Settings{' '}
            </Button>
          )}
        </HStack>
      </VStack>
    </Container>
  );
}

export default App;