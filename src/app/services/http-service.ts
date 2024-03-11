export class HttpService {
  async submitItemDetails(itemDetails: string) {
    try {
      const response = await fetch('http://localhost:9009/coach-config/v1.0/item/details', {
        method: 'POST',
        body: itemDetails,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      return null;
    } catch (error) {
      if (error instanceof Error) {
        console.log('error message: ', error.message);
        return error.message;
      } else {
        console.log('unexpected error: ', error);
        return 'An unexpected error occurred';
      }
    }
  }
}