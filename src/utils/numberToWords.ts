const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const twoDigits = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tensMultiple = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertLessThanThousand(n: number): string {
  let result = '';
  if (n >= 100) {
    result += singleDigits[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
  }
  if (n >= 10 && n <= 19) {
    result += twoDigits[n - 10] + ' ';
  } else if (n >= 20) {
    result += tensMultiple[Math.floor(n / 10)] + ' ';
    if (n % 10 > 0) {
      result += singleDigits[n % 10] + ' ';
    }
  } else if (n > 0) {
    result += singleDigits[n] + ' ';
  }
  return result;
}

export function numberToIndianWords(amount: number): string {
  if (amount === 0) return 'Rupees Zero Only';
  if (isNaN(amount)) return '';

  const rounded = Math.abs(amount);
  const rupees = Math.floor(rounded);
  const paise = Math.round((rounded - rupees) * 100);

  let word = '';

  const crore = Math.floor(rupees / 10000000);
  let remainder = rupees % 10000000;

  const lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;

  const thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  const hundred = remainder;

  if (crore > 0) {
    word += convertLessThanThousand(crore) + 'Crore ';
  }
  if (lakh > 0) {
    word += convertLessThanThousand(lakh) + 'Lakh ';
  }
  if (thousand > 0) {
    word += convertLessThanThousand(thousand) + 'Thousand ';
  }
  if (hundred > 0) {
    word += convertLessThanThousand(hundred);
  }

  let finalStr = 'Rupees ' + word.trim();

  if (paise > 0) {
    finalStr += ' and ' + convertLessThanThousand(paise).trim() + ' Paise';
  }

  return finalStr + ' Only';
}
