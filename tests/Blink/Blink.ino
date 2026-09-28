void setup() {
  Serial.begin(9600);
  pinMode(13, OUTPUT);
  Serial.println("Hello from ATmega328P Simulator!");
}

void loop() {
  digitalWrite(13, HIGH);
  Serial.println("Tick...");
  delay(1000);
  digitalWrite(13, LOW);
  Serial.println("Tock...");
  delay(1000);
}
