import { useState } from 'react';
import { hash } from 'starknet';

import { useChiQuiz } from '@/hooks/useChiQuiz';
import { useTrialError } from '@/hooks/useTrialError';
import { BaseTrialProps } from '@/lib/types';
import { getTrialStatusFlags } from '@/lib/utils';
import { StatusMessage } from './TrialStatus';
import { SubmitButton } from './SubmitButton';
import chiData from '../../../spec/chi.json';
import { CHI_TEXT } from '@/lib/uiText';

interface ChiQuestion {
  id: number;
  question: string;
  options: string[];
  answer_hash: string;
}

interface ShuffledQuestion {
  originalId: number;
  displayId: number;
  question: string;
  options: string[];
  optionMapping: number[]; // Maps displayed index to original index
}

// Fisher-Yates shuffle
function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Hash an answer using the format: keccak256(question_index + ":" + answer_text)
 */
function hashAnswer(questionIndex: number, answerText: string): string {
  const hashInput = `${questionIndex}:${answerText}`;
  return `0x${hash.starknetKeccak(hashInput).toString(16)}`;
}

export function ChiTrial({ status, onComplete, tokenId }: BaseTrialProps) {
  const { submitQuiz, isLoading, error } = useChiQuiz(tokenId, onComplete);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const { isDisabled, isCompleted } = getTrialStatusFlags(status);
  const { setLocalError, displayError, showError } = useTrialError(error, isCompleted);

  // Function to generate shuffled questions
  const generateShuffledQuestions = (): ShuffledQuestion[] => {
    const allQuestions = chiData.questions as ChiQuestion[];

    // Select 3 random questions
    const selectedQuestions = shuffle(allQuestions).slice(0, 3);

    // Shuffle the selected questions
    const shuffledSelected = shuffle(selectedQuestions);

    // For each question, shuffle the options and track the mapping
    return shuffledSelected.map((q, displayIndex) => {
      const optionsWithIndices = q.options.map((opt, idx) => ({ opt, idx }));
      const shuffledOptions = shuffle(optionsWithIndices);

      return {
        originalId: q.id,
        displayId: displayIndex,
        question: q.question,
        options: shuffledOptions.map(o => o.opt),
        optionMapping: shuffledOptions.map(o => o.idx)
      };
    });
  };

  // Randomly select 3 questions and shuffle both questions and options
  // Using useState with function initializer ensures fresh shuffle on every mount
  const [shuffledQuestions, setShuffledQuestions] = useState<ShuffledQuestion[]>(generateShuffledQuestions);

  const allAnswered = shuffledQuestions.every((q) => answers[q.displayId] !== undefined);

  const handleAnswerSelect = (displayId: number, displayOptionIndex: number) => {
    if (isDisabled) return;
    setAnswers((prev) => ({ ...prev, [displayId]: displayOptionIndex }));
    setLocalError(null);
  };

  const handleSubmit = async () => {
    if (!allAnswered) {
      setLocalError(CHI_TEXT.errors.answerAll);
      return;
    }

    // Prepare data for contract submission
    // Contract expects: arrays of question indices and answer hashes
    const questionIndices: number[] = [];
    const answerHashes: string[] = [];
    let correctCount = 0;

    shuffledQuestions.forEach((q) => {
      const displayOptionIndex = answers[q.displayId];
      const originalOptionIndex = q.optionMapping[displayOptionIndex];
      const answerText = chiData.questions[q.originalId].options[originalOptionIndex];
      const userAnswerHash = hashAnswer(q.originalId, answerText);

      questionIndices.push(q.originalId);
      answerHashes.push(userAnswerHash);

      // Check if answer is correct by comparing with stored answer hash
      const correctAnswerHash = chiData.questions[q.originalId].answer_hash;
      if (userAnswerHash === correctAnswerHash) {
        correctCount++;
      }
    });

    // Validate that user has at least 3 correct answers before submitting
    if (correctCount < 3) {
      setLocalError(CHI_TEXT.errors.needCorrect);
      // Re-shuffle questions to prevent trivial cheating
      setShuffledQuestions(generateShuffledQuestions());
      // Clear answers for new questions
      setAnswers({});
      return;
    }

    await submitQuiz(questionIndices, answerHashes);
  };

  return (
    <div className="space-y-4">
      {isCompleted ? (
        <StatusMessage
          type="info"
          message={CHI_TEXT.complete.title}
          detail={CHI_TEXT.complete.message}
        />
      ) : (
        <>
          <div className="space-y-6 mb-6">
            {shuffledQuestions.map((question, qIndex) => (
              <div key={question.displayId} className="bg-ronin-dark/30 rounded-md p-4 border border-ronin-light/10">
                <p className="text-ronin-secondary font-medium mb-4 flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-ronin-accent/20 text-ronin-accent text-sm flex items-center justify-center font-bold">
                    {qIndex + 1}
                  </span>
                  <span>{question.question}</span>
                </p>
                <div className="space-y-2 ml-8">
                  {question.options.map((option, optionIndex) => {
                    const isSelected = answers[question.displayId] === optionIndex;

                    const borderColor = isSelected ? 'border-ronin-accent/50' : 'border-ronin-light/20';
                    const bgColor = isSelected ? 'bg-ronin-accent/10' : 'bg-ronin-light/10';
                    const textColor = 'text-ronin-secondary';

                    return (
                      <button
                        key={optionIndex}
                        onClick={() => handleAnswerSelect(question.displayId, optionIndex)}
                        disabled={isDisabled}
                        className={`w-full text-left px-4 py-3 rounded-md border ${borderColor} ${bgColor} hover:border-ronin-accent/40 disabled:cursor-not-allowed transition-all ${textColor}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'border-ronin-accent bg-ronin-accent'
                              : 'border-ronin-light/30'
                          }`}>
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-ronin-dark"></div>
                            )}
                          </div>
                          <span className="text-sm">{option}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <SubmitButton
            onClick={handleSubmit}
            disabled={!allAnswered || isDisabled}
            isLoading={isLoading}
            loadingText={CHI_TEXT.submitting}
          >
            {CHI_TEXT.submit}
          </SubmitButton>
        </>
      )}

      {showError && (
        <StatusMessage
          type="error"
          message={displayError}
        />
      )}
    </div>
  );
}
