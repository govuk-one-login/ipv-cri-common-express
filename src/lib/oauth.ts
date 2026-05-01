interface AuthParams {
  redirect_uri?: string;
  state?: string;
  error?: {
    code?: string;
    description?: string;
    message?: string;
    error_description?: string;
  };
  authorization_code?: string;
  client_id?: string;
}

interface OAuthData {
  redirect_uri?: string;
  state?: string;
  code?: string | { value?: string };
}

const addOAuthPropertiesToSession = ({
  authParams = {},
  data = {},
}: { authParams?: AuthParams; data?: OAuthData } = {}) => {
  authParams.redirect_uri = data.redirect_uri;
  authParams.state = data.state;

  if (!data.code) {
    const error = {
      code: "server_error",
      error_description: "Failed to retrieve authorization code",
    };

    authParams.error = error;
  } else {
    authParams.authorization_code =
      typeof data.code === "object" ? data.code?.value : data.code;
  }
};

const buildRedirectUrl = ({ authParams }: { authParams: AuthParams }) => {
  const authCode = authParams.authorization_code;
  const url = authParams.redirect_uri;
  const state = authParams.state;

  let redirectUrl = new URL(url as string);

  if (!authCode) {
    const error = authParams.error;
    const errorCode = error?.code;
    const errorDescription = error?.description ?? error?.message;

    redirectUrl.searchParams.append("error", errorCode as string);
    redirectUrl.searchParams.append("error_description", errorDescription as string);
  } else {
    redirectUrl.searchParams.append("client_id", authParams.client_id as string);
    redirectUrl.searchParams.append("code", authCode);
  }

  if (state) {
    redirectUrl.searchParams.append("state", state);
  }

  return redirectUrl;
};

export { addOAuthPropertiesToSession, buildRedirectUrl };
