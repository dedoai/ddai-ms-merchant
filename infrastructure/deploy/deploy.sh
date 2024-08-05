#!/bin/bash

origFile=$( cat ./infrastructure/aws/cloudformation.yml )
input_string=$(cat ./infrastructure/envs/dev.txt)
IFS="="
while read -r chiave valore;
do
	valore=$(echo $valore | sed  "s/\//\\\\\//g");
	echo "Chiave: $chiave, Valore: $valore";
	if [[ $(uname) == "Darwin" ]];
	then
		origFile=$( sed  "s/{{$chiave}}/$valore/g" <<< "$origFile" ); 
	else
		origFile=$( sed  "s/{{$chiave}}/$valore/g" <<< "$origFile" ); 
	fi;
done <<< "$input_string"

echo $origFile > ./infrastructure/aws/cfn.yml
echo "------------------- DUMP CLOUFORMATION -----------------"
cat ./infrastructure/aws/cfn.yml
echo "------------------- EXEC CLOUDFORMATION ----------------"

aws cloudformation deploy --stack-name ddaiMerchantApi --template-file ./infrastructure/aws/cfn.yml  --parameter-overrides EcrImageUri=${IMAGE_URI}  --capabilities CAPABILITY_IAM
