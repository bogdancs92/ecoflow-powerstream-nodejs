FROM node:latest

ENV NODE_ENV=development \
    KEY_MAIL=your_email_ecoflow_app \
    KEY_URL=cmd \
    KEY_PASSWORD=your_password_ecoflow_app \
    KEY_POWERSTREAM_SN=HW51xxxxxxxxxxxxx \
    KEY_QUERY_AC=ac_output_watt \
    KEY_QUERY_PRIO=power_supply_mode \
    TOKEN=my_token \
    TOKEN_VAL=my_secret_for_token

RUN apt-get update
RUN apt-get install -y nano git iproute2 htop

WORKDIR /usr/src/app

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --development

COPY . .

EXPOSE 8000

CMD ["node", "server.js"]
