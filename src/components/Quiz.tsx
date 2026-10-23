import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, CheckCircle2, XCircle } from "lucide-react";
import type { Lesson } from "@/lib/lessonData";

interface QuizProps {
  lesson: Lesson;
  onComplete: (score: number) => void;
}

export function Quiz({ lesson, onComplete }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);

  const question = lesson.quiz[currentQuestion];
  const isLastQuestion = currentQuestion === lesson.quiz.length - 1;

  const handleAnswer = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === question.correctAnswer;
    const newAnswers = [...answers, isCorrect];
    setAnswers(newAnswers);

    if (isCorrect) {
      setScore(score + 1);
    }

    setShowResult(true);
  };

  const handleNext = () => {
    setShowResult(false);
    setSelectedAnswer(null);

    if (isLastQuestion) {
      setShowSummary(true);
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const percentage = Math.round((score / lesson.quiz.length) * 100);

  if (showSummary) {
    return (
      <Card className="p-12 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
          <Trophy className="w-10 h-10 text-primary" />
        </div>

        <h2 className="text-4xl font-bold mb-4">Quiz Complete!</h2>
        <p className="text-xl text-muted-foreground mb-8">
          You scored {score} out of {lesson.quiz.length}
        </p>

        <div className="mb-8">
          <div className="text-6xl font-bold text-primary mb-2">{percentage}%</div>
          <p className="text-muted-foreground">
            {percentage >= 80
              ? "Excellent work! You've mastered this lesson."
              : percentage >= 60
              ? "Good job! Review the material for better retention."
              : "Keep learning! Try reviewing the lesson again."}
          </p>
        </div>

        <Button onClick={() => onComplete(score)} size="lg">
          Back to Lessons
        </Button>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Badge variant="outline" className="mb-4">
          Question {currentQuestion + 1} of {lesson.quiz.length}
        </Badge>
        <h2 className="text-3xl font-bold mb-2">Quiz Time!</h2>
        <p className="text-muted-foreground">Test your knowledge of {lesson.title}</p>
      </div>

      <Card className="p-8">
        <h3 className="text-2xl font-bold mb-6">{question.question}</h3>

        <div className="space-y-3 mb-8">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === question.correctAnswer;
            const showCorrectAnswer = showResult && isCorrect;
            const showWrongAnswer = showResult && isSelected && !isCorrect;

            return (
              <button
                key={index}
                onClick={() => !showResult && setSelectedAnswer(index)}
                disabled={showResult}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  showCorrectAnswer
                    ? "border-green-500 bg-green-500/10"
                    : showWrongAnswer
                    ? "border-red-500 bg-red-500/10"
                    : isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{option}</span>
                  {showCorrectAnswer && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  {showWrongAnswer && <XCircle className="w-5 h-5 text-red-500" />}
                </div>
              </button>
            );
          })}
        </div>

        {showResult && (
          <Card className="p-4 mb-6 bg-muted">
            <p className="font-medium mb-2">
              {selectedAnswer === question.correctAnswer ? "Correct! 🎉" : "Incorrect"}
            </p>
            <p className="text-sm text-muted-foreground">{question.explanation}</p>
          </Card>
        )}

        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Score: {score}/{currentQuestion + (showResult ? 1 : 0)}
          </p>

          {!showResult ? (
            <Button onClick={handleAnswer} disabled={selectedAnswer === null}>
              Submit Answer
            </Button>
          ) : (
            <Button onClick={handleNext}>
              {isLastQuestion ? "See Results" : "Next Question"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
