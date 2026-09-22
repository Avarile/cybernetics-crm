// Interactive confirmation prompt shown before destructive CLI commands proceed.
import { Question, QuestionSet } from 'nest-commander';

@QuestionSet({
  name: 'confirm',
})
export class ConfirmationQuestion {
  @Question({
    type: 'confirm',
    name: 'confirmation',
    message:
      "You are about to delete data from database. Are you sure to continue? Consider the '--dry-run' option first",
  })
  parseConfirm(val: string): boolean {
    return Boolean(val);
  }
}
