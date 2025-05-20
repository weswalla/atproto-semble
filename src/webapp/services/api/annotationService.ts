  async getMyAnnotations(token: string): Promise<any[]> {
    try {
      const response = await this.api.get('/annotations/my-annotations', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
