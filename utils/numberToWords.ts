
export const numberToWords = (num: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  const convert_thousands = (n: number): string => {
    if (n >= 1000) {
      return convert_thousands(Math.floor(n / 1000)) + " Thousand " + convert_hundreds(n % 1000);
    } else {
      return convert_hundreds(n);
    }
  };

  const convert_hundreds = (n: number): string => {
    if (n > 99) {
      return ones[Math.floor(n / 100)] + " Hundred " + convert_tens(n % 100);
    } else {
      return convert_tens(n);
    }
  };

  const convert_tens = (n: number): string => {
    if (n < 10) return ones[n];
    else if (n >= 10 && n < 20) return teens[n - 10];
    else {
      return tens[Math.floor(n / 10)] + " " + ones[n % 10];
    }
  };

  if (num === 0) return "Zero";
  
  // Handle millions if needed, but for retail thousands is usually enough
  // Let's add millions just in case
  const convert_millions = (n: number): string => {
    if (n >= 1000000) {
      return convert_millions(Math.floor(n / 1000000)) + " Million " + convert_thousands(n % 1000000);
    } else {
      return convert_thousands(n);
    }
  };

  return convert_millions(num).trim();
};
