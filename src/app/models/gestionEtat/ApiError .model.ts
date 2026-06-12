export interface ApiError {
  success:          boolean;
  code:             string;
  timestamp:        string;
  status:           number;
  error:            string;
  message:          string;
  path:             string;
  requestId:        string;
  validationErrors: any | null;
}