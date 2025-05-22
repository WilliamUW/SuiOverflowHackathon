sui client envs
sui client active-env
sui client active-address 

sui client gas  
 
sui client publish --gas-budget 20000000


export PACKAGE_ID=0xe0d9f97eed4f6a89dd0dea44db975c3f1b3f30f70fee75d5302e4e5e9adc2e3a            

sui client call --function mint --module hello_world --package $PACKAGE_ID --gas-budget 10000000